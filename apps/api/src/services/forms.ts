import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// FORM CRUD MANAGEMENT
// ─────────────────────────────────────────────────────────────

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'dropdown' | 'checkbox' | 'date' | 'file';
  required: boolean;
  options?: string[]; // For dropdown/checkbox
  conditionalLogic?: {
    dependsOnField: string;
    valueEquals: string;
    show: boolean;
  };
}

export async function createForm(
  tenantId: string,
  data: {
    title: string;
    description?: string;
    fields: FormField[];
    confirmationMessage?: string;
    status?: string;
  }
): Promise<any> {
  return await prisma.customForm.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description,
      fields: JSON.stringify(data.fields),
      confirmationMessage: data.confirmationMessage || 'Thank you for your submission!',
      status: data.status || 'published',
    },
  });
}

export async function getForm(tenantId: string, formId: string): Promise<any> {
  const form = await prisma.customForm.findFirst({
    where: { id: formId, tenantId },
  });
  if (!form) {
    throw new Error('Custom form not found');
  }
  return {
    ...form,
    fields: JSON.parse(form.fields),
  };
}

export async function listForms(tenantId: string, status?: string): Promise<any[]> {
  const forms = await prisma.customForm.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return forms.map(f => ({
    ...f,
    fields: JSON.parse(f.fields),
  }));
}

// ─────────────────────────────────────────────────────────────
// LEAD CAPTURE & FORM SUBMISSIONS
// ─────────────────────────────────────────────────────────────

export async function submitForm(
  tenantId: string,
  formId: string,
  data: {
    memberId?: string;
    answers: { [fieldName: string]: any };
    fileUrl?: string;
  }
): Promise<any> {
  const form = await prisma.customForm.findFirst({
    where: { id: formId, tenantId },
  });
  if (!form) {
    throw new Error('Form not found');
  }

  const fields: FormField[] = JSON.parse(form.fields);

  // 1. Validate required fields (taking into account conditional logic)
  fields.forEach(field => {
    let checkValidation = true;

    // Check conditional logic
    if (field.conditionalLogic) {
      const cond = field.conditionalLogic;
      const dependVal = data.answers[cond.dependsOnField];
      const isMet = dependVal === cond.valueEquals;
      
      // If conditional logic determines the field is hidden, skip validation checks
      if ((cond.show && !isMet) || (!cond.show && isMet)) {
        checkValidation = false;
      }
    }

    if (checkValidation && field.required) {
      const val = data.answers[field.name];
      if (val === undefined || val === null || val === '') {
        throw new Error(`Field "${field.label}" is required`);
      }
    }
  });

  let memberId = data.memberId;

  // 2. Lead Capture: Auto create CRM / Member record if email is present and no member exists
  const emailVal = data.answers['email'] || data.answers['Email'];
  if (!memberId && emailVal && typeof emailVal === 'string') {
    const emailClean = emailVal.toLowerCase().trim();
    
    // Check if member already exists
    const existingMember = await prisma.member.findFirst({
      where: { email: emailClean, tenantId },
    });

    if (existingMember) {
      memberId = existingMember.id;
    } else {
      // Register a new Member with visitor status
      const firstNameVal = data.answers['firstName'] || data.answers['First Name'] || 'Guest';
      const lastNameVal = data.answers['lastName'] || data.answers['Last Name'] || 'User';
      const phoneVal = data.answers['phone'] || data.answers['Phone'] || null;

      const newMember = await prisma.member.create({
        data: {
          tenantId,
          firstName: firstNameVal,
          lastName: lastNameVal,
          email: emailClean,
          phone: phoneVal,
          membershipStatus: 'visitor',
        },
      });
      memberId = newMember.id;

      // Automatically build a CRM Contact record for this guest lead
      await prisma.crmContact.create({
        data: {
          tenantId,
          memberId: newMember.id,
          firstName: firstNameVal,
          lastName: lastNameVal,
          email: emailClean,
          phone: phoneVal,
          leadSource: 'form_submission',
          status: 'lead',
        },
      });
    }
  }

  // 3. Determine if approval is needed (if form has approval-type workflows, default to pending, else not_required)
  const triggers = await prisma.formWorkflowTrigger.findMany({
    where: { formId, tenantId, triggerType: 'approval' },
  });
  const approvalStatus = triggers.length > 0 ? 'pending' : 'not_required';

  const submission = await prisma.formSubmission.create({
    data: {
      tenantId,
      formId,
      memberId,
      answers: JSON.stringify(data.answers),
      fileUrl: data.fileUrl,
      approvalStatus,
    },
    include: {
      member: true,
      form: true,
    },
  });

  // 4. Execute immediate "submission" trigger workflows
  await executeWorkflows(tenantId, submission.id, 'submission');

  return {
    ...submission,
    answers: JSON.parse(submission.answers),
  };
}

// ─────────────────────────────────────────────────────────────
// WORKFLOW AUTOMATION TRIGGERS & ACTIONS
// ─────────────────────────────────────────────────────────────

export async function createWorkflowTrigger(
  tenantId: string,
  formId: string,
  data: {
    triggerType: string; // submission | approval | rejection
    conditionField?: string;
    conditionValue?: string;
  }
): Promise<any> {
  const form = await prisma.customForm.findFirst({
    where: { id: formId, tenantId },
  });
  if (!form) {
    throw new Error('Form not found');
  }

  return await prisma.formWorkflowTrigger.create({
    data: {
      tenantId,
      formId,
      triggerType: data.triggerType.toLowerCase().trim(),
      conditionField: data.conditionField,
      conditionValue: data.conditionValue,
    },
  });
}

export async function addWorkflowAction(
  tenantId: string,
  triggerId: string,
  data: {
    actionType: string; // send_email | create_task | create_crm_contact | notify_staff
    target?: string;
    templateText?: string;
  }
): Promise<any> {
  const trigger = await prisma.formWorkflowTrigger.findFirst({
    where: { id: triggerId, tenantId },
  });
  if (!trigger) {
    throw new Error('Workflow trigger not found');
  }

  return await prisma.formWorkflowAction.create({
    data: {
      tenantId,
      triggerId,
      actionType: data.actionType.toLowerCase().trim(),
      target: data.target,
      templateText: data.templateText,
    },
  });
}

export async function executeWorkflows(
  tenantId: string,
  submissionId: string,
  triggerType: 'submission' | 'approval' | 'rejection'
): Promise<void> {
  const submission = await prisma.formSubmission.findFirst({
    where: { id: submissionId, tenantId },
    include: { member: true },
  });
  if (!submission) return;

  const answers = JSON.parse(submission.answers);

  // Find triggers matching this form & type
  const triggers = await prisma.formWorkflowTrigger.findMany({
    where: {
      formId: submission.formId,
      tenantId,
      triggerType,
    },
    include: { actions: true },
  });

  for (const trigger of triggers) {
    let matchesCondition = true;

    // Check condition fields if configured
    if (trigger.conditionField && trigger.conditionValue) {
      const fieldVal = answers[trigger.conditionField];
      matchesCondition = String(fieldVal) === String(trigger.conditionValue);
    }

    if (matchesCondition) {
      for (const action of trigger.actions) {
        if (action.actionType === 'send_email') {
          // Email dispatch mock simulation
          const toAddress = action.target || (submission.member ? submission.member.email : 'guest@example.com');
          console.log(`[FormEmailWorkflow] Dispatching email to ${toAddress}: "${action.templateText}"`);
        } else if (action.actionType === 'create_task') {
          // Create follow-up tasks linked to the CRM follow-up model
          // Find any active CRM contact for the member
          if (submission.memberId) {
            const contact = await prisma.crmContact.findFirst({
              where: { memberId: submission.memberId, tenantId },
            });

            // Create CRM Follow-Up Task
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 3); // 3 days from now

            await prisma.crmFollowUpTask.create({
              data: {
                tenantId,
                contactId: contact ? contact.id : 'unknown-contact-id',
                title: action.templateText || 'Follow up on form submission',
                description: `Triggered by form submission ${submissionId}`,
                priority: 'medium',
                status: 'pending',
                dueDate,
              },
            });
          }
        } else if (action.actionType === 'notify_staff') {
          console.log(`[FormStaffNotification] Alerting Staff (${action.target}): ${action.templateText}`);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// APPROVALS & MODERATION
// ─────────────────────────────────────────────────────────────

export async function processApproval(
  tenantId: string,
  submissionId: string,
  approvedById: string,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<any> {
  const submission = await prisma.formSubmission.findFirst({
    where: { id: submissionId, tenantId },
  });
  if (!submission) {
    throw new Error('Form submission not found');
  }

  const approver = await prisma.user.findFirst({
    where: { id: approvedById, tenantId },
  });
  if (!approver) {
    throw new Error('Approver user not found');
  }

  const updated = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: {
      approvalStatus: status,
      approvedById,
      approvalNotes: notes,
    },
    include: {
      member: true,
      form: true,
    },
  });

  // Execute conditional trigger workflows based on approval outcome
  if (status === 'approved') {
    await executeWorkflows(tenantId, submissionId, 'approval');
  } else {
    await executeWorkflows(tenantId, submissionId, 'rejection');
  }

  return {
    ...updated,
    answers: JSON.parse(updated.answers),
  };
}

// ─────────────────────────────────────────────────────────────
// SUBMISSION LISTINGS & REPORT
// ─────────────────────────────────────────────────────────────

export async function listFormSubmissions(
  tenantId: string,
  formId: string,
  options?: { approvalStatus?: string }
): Promise<any[]> {
  const list = await prisma.formSubmission.findMany({
    where: {
      tenantId,
      formId,
      ...(options?.approvalStatus ? { approvalStatus: options.approvalStatus } : {}),
    },
    include: {
      member: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return list.map(s => ({
    ...s,
    answers: JSON.parse(s.answers),
  }));
}

export async function getFormReport(tenantId: string, formId: string): Promise<any> {
  const form = await prisma.customForm.findFirst({
    where: { id: formId, tenantId },
  });
  if (!form) {
    throw new Error('Form not found');
  }

  const submissions = await prisma.formSubmission.findMany({
    where: { formId, tenantId },
  });

  const totalSubmissions = submissions.length;

  const approvalStatusCounts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    not_required: 0,
  };

  submissions.forEach(s => {
    const status = s.approvalStatus as keyof typeof approvalStatusCounts;
    if (approvalStatusCounts[status] !== undefined) {
      approvalStatusCounts[status] += 1;
    }
  });

  // Aggregate answer counts for dropdown / checkbox / options fields
  const fields: FormField[] = JSON.parse(form.fields);
  const aggregates: { [fieldName: string]: { [option: string]: number } } = {};

  fields.forEach(field => {
    if (field.type === 'dropdown' || field.type === 'checkbox') {
      aggregates[field.name] = {};
      if (field.options) {
        field.options.forEach(opt => {
          aggregates[field.name][opt] = 0;
        });
      }
    }
  });

  submissions.forEach(s => {
    const answers = JSON.parse(s.answers);
    Object.keys(aggregates).forEach(fieldName => {
      const ansVal = answers[fieldName];
      if (ansVal) {
        if (Array.isArray(ansVal)) {
          ansVal.forEach(v => {
            if (aggregates[fieldName][v] !== undefined) {
              aggregates[fieldName][v] += 1;
            }
          });
        } else {
          if (aggregates[fieldName][ansVal] !== undefined) {
            aggregates[fieldName][ansVal] += 1;
          }
        }
      }
    });
  });

  return {
    formTitle: form.title,
    totalSubmissions,
    approvalStatusCounts,
    aggregates,
  };
}
