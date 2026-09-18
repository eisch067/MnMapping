# MnDOT public map catalog

Verified September 18, 2026 against the official [MnDOT public maps ArcGIS group](https://mndot.maps.arcgis.com/home/group.html?id=5512eb73472944e5be6b60f56e3a2e61&view=grid&showFilters=false&sortField=title&sortOrder=asc#content).

The group currently contains 28 items. It is a useful source of transportation reference maps, but it does not publish aerial-imagery layers and therefore does not change the county imagery inventory.

## Useful MnMapping candidates

| Subject | Published group items | Potential use |
| --- | --- | --- |
| Bicycle infrastructure | Minnesota Bikeways applications | Optional statewide reference layer for roads, trails, and route context. |
| Bridges | Minnesota Bridge Interactive Map and Minnesota Historic Bridges | Optional structure and historic-resource overlays. |
| Roadside programs | Minnesota Adopt a Highway and Rest Areas | Rest-area and adopted-highway reference features. |
| Tribal context | MnDOT Tribal Map Application | Tribal transportation and district context; source definitions require review before integration. |
| Transit | Find Your Transit Provider Web App | Regional transit-provider lookup rather than an imagery source. |
| Freight | National Highway Freight Network/System maps and services | Freight corridors and project locations. These are the group's only two directly listed Feature Services. |
| Safety and operations | J-turn locations, reduced-conflict intersection evaluation, lane closures, and superload corridors | Specialized overlays that should remain opt-in if added. |
| Projects and contractors | State Aid projects, quick-build projects, and certified small businesses | Planning and procurement references rather than general map layers. |

## Integration rule

Most group entries are applications, web maps, story maps, or code attachments rather than direct reusable data services. Before adding one to MnMapping, inspect its underlying web map and service, confirm anonymous read access, record the feature meaning and attribution, and decide whether it belongs in the general reference-layer panel. The two freight Feature Services are discoverable directly, but should still be checked for schema, statewide usefulness, and rendering cost before implementation.

