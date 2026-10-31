# Glossary

| Term | Meaning | Avoid |
| --- | --- | --- |
| scene | The YAML an AI writes: canvas, mode, objects, texts. | image, template |
| canvas | Width, height and theme of the scene. | page |
| asset | One of the 86 drawn things (`tree`, `desk`, `person`...). | sprite, icon |
| group | A named set of assets placed together (`group:`). | cluster |
| part | A piece of an asset that can be recolored. | layer |
| shot | A named camera framing (`wide`, `medium`, ...). | zoom preset |
| focus | The object the composition leans toward. | center |
| kit | A rendering style (`flat`, `hatch`, `outline`, `paper`, `riso`, `sketch`). | filter, skin |
| theme | The color palette and mood. | style |
| harmony | The color harmony used to generate a palette from seed colors (analogous, complementary, split, triad, mono). | color scheme |
| mood | Lightness and contrast bands for a generated theme (day, dusk, night). | brightness |
| time | Time of day setting light color and color grade (golden, noon, overcast, dusk, night). | hour |
| ridges | Number of procedural background ridge layers in outdoor scenes (0..4). | hills, mountains |
| clouds | Ambient sky cloud density (none, few, many). | cloudiness |
| ground detail | Procedural ground gradient, low-contrast blobs and scattered tufts (none, low, high). | grass |
| shafts | Volumetric light shafts and floor projection from indoor windows. | sunbeams |
| framing | Out-of-focus foreground repoussoir elements (foliage, curtain, plants, none). | border, vignette |
| detail | How much an object draws: `low` drops small parts, `mid` is the base drawing, `high` adds highlights and texture. The focus gets `high`, `depth: far` gets `low`, an author can set it per object. | level of detail |
| body | Person proportions: `chibi` (head to body about 1:2), `standard`, `long` (about 1:6). | build (that is width) |
| blob | A closed smooth seeded path with a varying radius, used for foliage and clouds instead of circles. | circle |
| outline wobble | The slight seeded displacement and heavier shadow-side weight of the outline kit silhouette. | jitter |
| font | Typeface family for text (`sans`, `serif`, `hand`). | typeface name |
| box style | Visual container for a caption (`rect`, `highlight`, `pill`, `sticker`, `underline`). | banner, badge |
| emphasis | Key words underlined in the `underline` caption style. | bold |
| tracking | Letter-spacing adjustment in em (automatically tighter for large titles). | kerning |
| balance | Balanced line break distribution across multi-line titles. | text-wrap |
| warning | A problem the compiler found in the scene. | error (an error stops compile) |
| critique | An art-director remark produced by `check` (`art` in the report). | lint |
| baseline | The SVG and layout stored for one regression case. | snapshot |
| best-of-N | Renders N variants of free parameters and keeps the one with the best critique score (`best`). | search, genetic |
| plane mode | The 2.5D layout with slots and depth. | scene mode |
| map mode | The layout that draws a route over the map of Europe. | geo |
