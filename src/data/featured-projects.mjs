// Build homepage cards from the Featured collection and project-level switches.
// A project switch is authoritative whenever a Featured card shares its slug.
const lead = (value) => String(value ?? '').split(/\n\s*\n/)[0].trim();
const languages = ['fa', 'de'];

export function buildFeaturedEntries(featuredEntries, projects) {
  const published = featuredEntries.filter(entry => entry.published !== false);
  const curatedBySlug = new Map(published.map(entry => [entry.slug, entry]));
  const projectSlugs = new Set(projects.map(project => project.slug));
  const entries = published.filter(entry => !projectSlugs.has(entry.slug));

  for (const project of projects) {
    if (!project.featured) continue;
    const curated = curatedBySlug.get(project.slug);
    if (curated) {
      entries.push(curated);
      continue;
    }
    const translations = Object.fromEntries(languages.map(language => {
      const translated = project.translations?.[language];
      return [language, {
        title: translated?.title || project.title,
        summary: lead(translated?.summary || project.summary),
      }];
    }));
    entries.push({
      slug: project.slug,
      order: project.order,
      title: project.title,
      summary: lead(project.summary),
      url: `/work/${project.slug}/`,
      image: project.thumbnail,
      emoji: project.emoji,
      translations,
    });
  }

  return entries.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}
