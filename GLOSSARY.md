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
| warning | A problem the compiler found in the scene. | error (an error stops compile) |
| critique | An art-director remark produced by `check` (`art` in the report). | lint |
| baseline | The SVG and layout stored for one regression case. | snapshot |
| best-of-N | Renders N variants of free parameters and keeps the one with the best critique score (`best`). | search, genetic |
| plane mode | The 2.5D layout with slots and depth. | scene mode |
| map mode | The layout that draws a route over the map of Europe. | geo |
