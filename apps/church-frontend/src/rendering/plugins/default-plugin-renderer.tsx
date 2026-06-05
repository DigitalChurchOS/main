import React from 'react';

export const DefaultPluginWidget: React.FC<{ data: any; context: any }> = ({ data, context }) => {
  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl font-sans my-2">
      <h4 className="font-bold text-slate-800 text-sm mb-2">{data?.title || 'Plugin Widget'}</h4>
      <p className="text-slate-600 text-xs">{data?.description || 'This widget is provided by a platform plugin.'}</p>
    </div>
  );
};

export const DefaultPluginPanel: React.FC<{ data: any; context: any }> = ({ data, context }) => {
  return (
    <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm font-sans my-4">
      <h3 className="font-semibold text-slate-900 text-base mb-3">{data?.title || 'Plugin Panel'}</h3>
      <div className="text-slate-700 text-sm">{data?.content || 'Plugin panel workspace details.'}</div>
    </div>
  );
};

export const DefaultPluginCard: React.FC<{ data: any; context: any }> = ({ data, context }) => {
  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm font-sans flex flex-col justify-between h-full">
      <div>
        <span className="inline-block text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-3">
          Plugin Card
        </span>
        <h4 className="font-semibold text-slate-800 text-sm mb-1">{data?.title || 'Plugin Card Title'}</h4>
        <p className="text-slate-500 text-xs mb-4 line-clamp-3">{data?.summary || 'Plugin contributed card summary details.'}</p>
      </div>
      {data?.cta && (
        <a
          href={data.cta.url || '#'}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {data.cta.label || 'Learn More'} →
        </a>
      )}
    </div>
  );
};

export const DefaultPluginForm: React.FC<{ data: any; context: any }> = ({ data, context }) => {
  return (
    <form className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 font-sans max-w-md mx-auto my-4" onSubmit={(e) => e.preventDefault()}>
      <h4 className="font-bold text-slate-800 text-sm border-b pb-2">{data?.title || 'Plugin Custom Form'}</h4>
      <p className="text-slate-500 text-xs">{data?.description || 'Fill in the information below.'}</p>
      <div className="space-y-3">
        {(data?.fields || []).map((field: any, idx: number) => (
          <div key={field.name || idx}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{field.label || field.name}</label>
            <input
              type="text"
              placeholder={field.placeholder || ''}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-slate-800"
              disabled
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="w-full text-xs font-bold text-white bg-slate-900 py-2 rounded-md hover:bg-slate-800 transition"
      >
        {data?.submitLabel || 'Submit Form'}
      </button>
    </form>
  );
};

export const DefaultPluginInlineAction: React.FC<{ data: any; context: any }> = ({ data, context }) => {
  return (
    <button
      type="button"
      className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 space-x-1 py-1"
    >
      <span>⚡ {data?.label || 'Action'}</span>
    </button>
  );
};

export const DefaultPluginUnavailableState: React.FC<{ message?: string }> = ({
  message = 'This extension is currently unavailable or disabled.'
}) => {
  return (
    <div className="p-6 text-center text-slate-500 bg-slate-50 border border-slate-100 rounded-xl font-sans max-w-md mx-auto my-2">
      <div className="text-xl mb-1">🔌</div>
      <div className="font-semibold text-xs text-slate-700 mb-1">Plugin Offline</div>
      <div className="text-[11px] text-slate-500">{message}</div>
    </div>
  );
};

export const DefaultPluginSetupRequiredState: React.FC<{ message?: string }> = ({
  message = 'This plugin requires configuration before it can be rendered.'
}) => {
  return (
    <div className="p-6 text-center text-blue-800 bg-blue-50 border border-blue-100 rounded-xl font-sans max-w-md mx-auto my-2">
      <div className="text-xl mb-1">⚙️</div>
      <div className="font-semibold text-xs text-blue-900 mb-1">Setup Required</div>
      <div className="text-[11px] text-blue-700">{message}</div>
    </div>
  );
};

export const DefaultPluginErrorState: React.FC<{ message?: string }> = ({
  message = 'An error occurred while loading this extension.'
}) => {
  return (
    <div className="p-6 text-center text-rose-800 bg-rose-50 border border-rose-100 rounded-xl font-sans max-w-md mx-auto my-2">
      <div className="text-xl mb-1">⚠️</div>
      <div className="font-semibold text-xs text-rose-900 mb-1">Extension Error</div>
      <div className="text-[11px] text-rose-700">{message}</div>
    </div>
  );
};
