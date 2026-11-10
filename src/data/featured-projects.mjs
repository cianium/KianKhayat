// Homepage cards use Projects as the single source of truth for project showcases.
// Independent Featured records (e.g. articles) remain curated in their own collection.
const lead = (value) => String(value ?? '').split(/\n\s*\n/)[0].trim();
const languages = ['fa', 'de'];

export function buildFeaturedEntries(featuredEntries, projects) {
  const projectSlugs = new Set(projects.map(project => project.slug));
  const entries = featuredEntries.filter(entry =>
    entry.published !== false && !projectSlugs.has(entry.slug)
  );

  for (const project of projects) {
    if (!project.featured) continue;
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
