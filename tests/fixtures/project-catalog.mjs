import {readdirSync,readFileSync} from 'node:fs';
const entries=(directory)=> {
  const root=new URL(directory,import.meta.url);
  return readdirSync(root).filter(name=>name.endsWith('.json')).map(name=>JSON.parse(readFileSync(new URL(name,root),'utf8')));
};
const projectRecords=entries('../../src/content/projects/');
const independentFeatured=entries('../../src/content/featured/');
const projectSlugs=new Set(projectRecords.map(project=>project.slug));

export const expectedProjectCount=projectRecords.length;
export const expectedFeaturedCount=projectRecords.filter(project=>project.featured).length+
  independentFeatured.filter(entry=>entry.published!==false && !projectSlugs.has(entry.slug)).length;
export const expectedActionCount=projectRecords.reduce((total,project)=>
  total+Number(Boolean(project.githubUrl))+Number(Boolean(project.liveUrl)),0);
export const expectedPrimaryCount=projectRecords.filter(project=>Boolean(project.liveUrl)).length;
