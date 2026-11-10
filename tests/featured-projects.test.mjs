import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFeaturedEntries} from '../src/data/featured-projects.mjs';

const project = {
  slug: 'barber-shop', order: 1, featured: true,
  title: 'Barbershop Cloud', summary: 'First paragraph.\n\nLong description.',
  thumbnail: '/media/projects/cover.png', emoji: '💈',
  translations: {
    fa: {title: 'آرایشگاه', summary: 'توضیح کوتاه.\n\nمتن طولانی.'},
    de: {title: 'Barbershop-Verwaltung', summary: 'Kurzbeschreibung.\n\nMehr Text.'},
  },
};

test('featured switch creates a translated homepage card linked to the project', () => {
  const cards = buildFeaturedEntries([], [project]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].url, '/work/barber-shop/');
  assert.equal(cards[0].image, project.thumbnail);
  assert.equal(cards[0].summary, 'First paragraph.');
  assert.equal(cards[0].translations.fa.summary, 'توضیح کوتاه.');
  assert.equal(cards[0].translations.de.title, 'Barbershop-Verwaltung');
});

test('disabled projects do not appear even if a legacy curated card exists', () => {
  const legacy = {slug: 'barber-shop', order: 1, published: true, url: '/work/barber-shop/', title: 'Custom'};
  assert.deepEqual(buildFeaturedEntries([legacy], [{...project, featured: false}]), []);
});

test('curated cards preserve custom cover and copy and never duplicate project entries', () => {
  const legacy = {slug: 'barber-shop', order: 2, published: true, url: '/work/barber-shop/', title: 'Curated', image: '/media/featured/special.png'};
  const cards = buildFeaturedEntries([legacy], [project]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].title, 'Curated');
  assert.equal(cards[0].image, '/media/featured/special.png');
});

test('independent featured items remain visible, unpublished items remain hidden, and cards are ordered', () => {
  const external = {slug: 'article', order: 0, published: true, title: 'Article'};
  const hidden = {slug: 'hidden', order: 0, published: false, title: 'Hidden'};
  const cards = buildFeaturedEntries([external, hidden], [project]);
  assert.deepEqual(cards.map(card => card.slug), ['article', 'barber-shop']);
});
