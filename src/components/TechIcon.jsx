import React from 'react';
import { Terminal, Box, Cloud, Shield, Activity, GitBranch, Server, Cpu, Database, Wrench } from 'lucide-react';

export const TechIcon = ({ name = '', size = 16, className = '', showLabel = false }) => {
  const norm = (name || '').toLowerCase().trim();

  let iconSvg = null;
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm.includes('github')) {
    bgClass = 'bg-slate-100 text-[#181717] border-slate-300';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="GitHub">
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.8 1.3 3.5 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
      </svg>
    );
  } else if (norm.includes('git') && !norm.includes('lab')) {
    bgClass = 'bg-orange-50 text-[#F05032] border-orange-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Git">
        <path d="M2.6 10.6L10.6 2.6c.8-.8 2.1-.8 2.8 0l1.8 1.8-2.3 2.3c-.6-.2-1.3-.1-1.8.4-.5.5-.6 1.2-.4 1.8L8.6 11c-.6-.2-1.3-.1-1.8.4-.8.8-.8 2.1 0 2.8.8.8 2.1.8 2.8 0 .5-.5.6-1.2.4-1.8l2.1-2.1c.6.2 1.3.1 1.8-.4.5-.5.6-1.2.4-1.8l2.3-2.3 6.6 6.6c.8.8.8 2.1 0 2.8L17.2 23.4c-.8.8-2.1.8-2.8 0l-11.8-11.8c-.8-.8-.8-2 0-2.8z" />
      </svg>
    );
  } else if (norm.includes('gitlab')) {
    bgClass = 'bg-orange-50 text-[#FC6D26] border-orange-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="GitLab">
        <path d="M23.95 13.58L22.4 8.8a.95.95 0 0 0-1.8-.02L18.8 14.4H5.2L3.4 8.78a.95.95 0 0 0-1.8.02L.05 13.58a1.9 1.9 0 0 0 .69 2.12l11.26 8.18 11.26-8.18a1.9 1.9 0 0 0 .69-2.12z" />
      </svg>
    );
  } else if (norm.includes('linux') || norm.includes('ubuntu') || norm.includes('bash') || norm.includes('shell')) {
    bgClass = 'bg-amber-50 text-amber-900 border-amber-200';
    iconSvg = <Terminal style={{ width: size, height: size }} />;
  } else if (norm.includes('jenkins')) {
    bgClass = 'bg-red-50 text-[#D24939] border-red-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Jenkins">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    );
  } else if (norm.includes('maven') || norm.includes('jacoco')) {
    bgClass = 'bg-rose-50 text-[#C71A36] border-rose-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Apache Maven">
        <path d="M19.16 2.15c-1.42 1.94-3.13 3.65-5.07 5.07-1.94 1.42-4.08 2.56-6.38 3.4L4.85 15.3l5.04 1.35 1.35 5.04 4.68-2.86c.84-2.3 1.98-4.44 3.4-6.38 1.42-1.94 3.13-3.65 5.07-5.07L19.16 2.15z" />
      </svg>
    );
  } else if (norm.includes('nexus')) {
    bgClass = 'bg-teal-50 text-[#1B6D85] border-teal-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Nexus Repository">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.8l7 3.5-7 3.5-7-3.5 7-3.5zm-8 6l7 3.5v7l-7-3.5v-7zm9 10.5v-7l7-3.5v7l-7 3.5z" />
      </svg>
    );
  } else if (norm.includes('sonar')) {
    bgClass = 'bg-sky-50 text-[#4B9FD5] border-sky-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="SonarQube">
        <path d="M3.2 12c0-4.86 3.94-8.8 8.8-8.8 2.06 0 3.95.71 5.46 1.9l1.45-1.45C17.02 2.07 14.64 1.2 12 1.2 6.04 1.2 1.2 6.04 1.2 12s4.84 10.8 10.8 10.8c2.64 0 5.02-.87 6.91-2.45l-1.45-1.45C15.95 20.09 14.06 20.8 12 20.8c-4.86 0-8.8-3.94-8.8-8.8z" />
      </svg>
    );
  } else if (norm.includes('tomcat')) {
    bgClass = 'bg-yellow-50 text-[#D1A153] border-yellow-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Apache Tomcat">
        <path d="M12 3a9 9 0 0 0-9 9c0 4.14 2.8 7.62 6.64 8.65.41.07.56-.18.56-.4v-1.41c-2.3.5-2.78-1.1-2.78-1.1-.38-.96-.92-1.22-.92-1.22-.75-.52.06-.5.06-.5.83.06 1.27.85 1.27.85.74 1.26 1.93.9 2.4.69.07-.54.29-.9.53-1.1-1.84-.21-3.77-.92-3.77-4.1 0-.9.32-1.64.85-2.22-.09-.21-.37-1.05.08-2.19 0 0 .7-.22 2.28.85A7.95 7.95 0 0 1 12 7.7c.71 0 1.43.1 2.1.28 1.58-1.07 2.28-.85 2.28-.85.45 1.14.17 1.98.08 2.19.53.58.85 1.32.85 2.22 0 3.19-1.93 3.89-3.78 4.1.3.26.57.77.57 1.55v2.3c0 .22.15.48.56.4A9.002 9.002 0 0 0 21 12a9 9 0 0 0-9-9z" />
      </svg>
    );
  } else if (norm.includes('nginx')) {
    bgClass = 'bg-emerald-50 text-[#009639] border-emerald-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Nginx">
        <path d="M12 2L2 7.8v11.4L12 25l10-5.8V7.8L12 2zm0 2.3l8 4.6v9.2l-8 4.6-8-4.6V8.9l8-4.6zm-4 4.7v8h2v-4.5l4 4.5h2V9h-2v4.5L10 9H8z" />
      </svg>
    );
  } else if (norm.includes('docker') || norm.includes('compose')) {
    bgClass = 'bg-sky-50 text-[#2496ED] border-sky-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Docker">
        <path d="M13.98 11.08h1.86v1.86h-1.86zm-2.4 0h1.86v1.86h-1.86zm-2.4 0h1.86v1.86H9.18zm-2.4 0h1.86v1.86H6.78zm7.2-2.4h1.86v1.86h-1.86zm-2.4 0h1.86v1.86h-1.86zm-2.4 0h1.86v1.86H9.18zm4.8-2.4h1.86v1.86h-1.86zm-2.4 0h1.86v1.86h-1.86zm11.7 5.64c-.23-.2-.77-.4-1.58-.2-.35-.74-1-1.32-1.8-1.55l-.36-.1-.23.3c-.6.82-.7 1.83-.24 2.7-.4.23-.97.35-1.63.35H1.4c-.2 0-.38.16-.4.36-.57 3.32.74 5.92 3.86 7.4 1.5.7 3.2.98 4.9.98 6.46 0 11.23-3.9 12.3-9.5.34-.1.8-.3 1.25-.74.1-.1.14-.23.1-.35-.04-.1-.13-.18-.23-.2z" />
      </svg>
    );
  } else if (norm.includes('terraform')) {
    bgClass = 'bg-purple-50 text-[#7B42BC] border-purple-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Terraform">
        <path d="M1.44 0v7.58l6.57 3.79V3.79zm7.58 4.38v7.57l6.57 3.79V8.17zm0 8.56v7.57l6.57 3.79v-7.57zm7.57-4.18v7.57L23.16 20v-7.57z" />
      </svg>
    );
  } else if (norm.includes('ansible')) {
    bgClass = 'bg-rose-50 text-[#EE0000] border-rose-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Ansible">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.1 17.58l-1.32-3.32H9.84l-1.07 2.68c-.14.34-.47.56-.84.56h-.74l4.3-10.74c.15-.37.5-.6.9-.6h.88c.4 0 .76.24.9.6l4.47 10.82h-1.54zm-2.03-4.82l-2.07-5.2-2.07 5.2h4.14z" />
      </svg>
    );
  } else if (norm.includes('kube') || norm.includes('k8s') || norm.includes('minikube') || norm.includes('eks')) {
    bgClass = 'bg-blue-50 text-[#326CE5] border-blue-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Kubernetes">
        <path d="M11.66 0a.7.7 0 0 0-.34.1L3.06 4.88a.7.7 0 0 0-.35.6v9.55c0 .25.13.48.35.6l8.26 4.77a.7.7 0 0 0 .7 0l8.26-4.77a.7.7 0 0 0 .35-.6V5.48a.7.7 0 0 0-.35-.6L12.02.1a.7.7 0 0 0-.36-.1zm.34 2.25l6.47 3.73-1.6 2.76-4.87-2.8v-3.7zm-1.99.78v3.68L5.14 9.5 3.54 6.75l6.47-3.72zm9.29 4.86l1.6 2.76-4.87 2.81v3.18l-1.6-2.77V10.7l4.87-2.81zm-14.6 1.58l4.87 2.81v3.18l-1.6 2.77V12.3L3.1 9.47l1.6-2.76zm4.87 5.28l1.99 1.15v4.57l-6.47-3.73 1.6-2.76 2.88 1.66v-.89zm4.86 1.15l1.99-1.15 2.88-1.66 1.6 2.76-6.47 3.73v-4.57z" />
      </svg>
    );
  } else if (norm.includes('helm')) {
    bgClass = 'bg-indigo-50 text-[#0F1689] border-indigo-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Helm">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V19h-2v-2.07c-2.83-.48-5-2.94-5-5.93h2c0 2.21 1.79 4 4 4s4-1.79 4-4h2c0 2.99-2.17 5.45-5 5.93zM12 6c1.66 0 3 1.34 3 3h-2c0-.55-.45-1-1-1s-1 .45-1 1H9c0-1.66 1.34-3 3-3z" />
      </svg>
    );
  } else if (norm.includes('aws') || norm.includes('amazon') || norm.includes('ec2') || norm.includes('s3') || norm.includes('vpc') || norm.includes('iam') || norm.includes('lambda')) {
    bgClass = 'bg-amber-50 text-[#FF9900] border-amber-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="AWS">
        <path d="M18.8 15.6c-2.4 1.8-5.9 2.7-8.9 2.7-4.2 0-8-1.5-10.9-4-.2-.2-.2-.5 0-.7l1.2-1c.2-.2.5-.2.7 0 2.3 2 5.4 3.2 8.9 3.2 2.5 0 5.4-.7 7.5-2.2.3-.2.7 0 .8.3l1 1.2c.2.2.1.4-.3.5zM20.2 13c-.3-.4-2-.2-3.1-.1-.3 0-.4-.3-.2-.5 1.5-1.1 3.9-.8 4.2-.4.3.4-.1 2.8-1.5 4-.2.2-.4.1-.4-.1.1-1 .9-2.6 1-2.9z" />
      </svg>
    );
  } else if (norm.includes('azure') || norm.includes('entra') || norm.includes('vnet')) {
    bgClass = 'bg-blue-50 text-[#0078D4] border-blue-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Azure">
        <path d="M13.48 2.05L5.7 13.9l5.08 3.55 4.88-9.82 5.08 10.32h3.26L13.48 2.05zm-8.8 13.33L0 21.95h13.06l-2.7-3.95H5.8l-1.12-2.62z" />
      </svg>
    );
  } else if (norm.includes('prometh')) {
    bgClass = 'bg-orange-50 text-[#E6522C] border-orange-200';
    iconSvg = <Activity style={{ width: size, height: size }} />;
  } else if (norm.includes('grafana')) {
    bgClass = 'bg-amber-50 text-[#F46800] border-amber-200';
    iconSvg = (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="img" aria-label="Grafana">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      </svg>
    );
  } else {
    bgClass = 'bg-slate-50 text-slate-700 border-slate-200';
    iconSvg = <Cpu style={{ width: size, height: size }} />;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-semibold ${bgClass} ${className}`}
      title={name}
    >
      <span className="shrink-0 flex items-center justify-center">{iconSvg}</span>
      {(showLabel || name) && <span className="truncate">{name}</span>}
    </div>
  );
};

export default TechIcon;
