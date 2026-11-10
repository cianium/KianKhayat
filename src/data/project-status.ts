import type {Language} from './sites';

export type ProjectStatus = 'Live' | 'In Progress' | 'Building' | 'Planned';
const labels: Record<ProjectStatus, Record<Language, string>> = {
  Live: {en:'Live', de:'Online', fa:'منتشرشده'},
  'In Progress': {en:'In Progress', de:'In Bearbeitung', fa:'در حال انجام'},
  Building: {en:'Building', de:'In Entwicklung', fa:'در حال ساخت'},
  Planned: {en:'Planned', de:'Geplant', fa:'برنامه‌ریزی‌شده'},
};

export function localizedProjectStatus(status: ProjectStatus, language: Language) {
  return labels[status][language];
}
