# Minnesota county ArcGIS imagery audit

Verified 2026-09-19. The machine-readable evidence is in `minnesota-county-arcgis-imagery-audit.json`.

This audit uses ArcGIS REST search, public organization metadata, full paginated organization item enumeration, item `/data` documents, referenced items, and live service requests. ArcGIS modified dates are never used as acquisition years. URLs carrying token-like query parameters are redacted and skipped.

## Statewide summary

- countiesAudited: 87
- countiesWithOfficialArcGisOnlineOrg: 54
- officialOrganizations: 59
- officialOwners: 430
- publicItemsEnumerated: 21366
- itemsInspected: 10065
- servicesInspected: 599
- wmtsLayersFound: 255
- anonymouslyVerifiedServices: 507

## County census

| County | Official ArcGIS organizations | Relevant owners | Public items | Inspected | Imagery/service findings |
| --- | --- | --- | ---: | ---: | ---: |
| Aitkin | Aitkin County, MN  (9VXTrji8YYqcgEwE) | ddh, shannon.wiebusch_aitkincountymn | 67 | 50 | 14/5 |
| Becker | None identified | None identified | 0 | 0 | 0/0 |
| Beltrami | Beltrami County/City of Bemidji (FgDWCkI65RQBnNsp) | BeltramiCountyGIS, BemidjiGISDept, KevinTrappe, ProWest0, abergstrom_beltrami, bcase_fgcivil, brettcase_BeltramiCounty, dbernard_bemidji, jcannon_beltrami, karguedas_beltrami, loriclark, zachrie.gutknecht_BeltramiCounty | 395 | 195 | 71/11 |
| Douglas | Douglas County MN Survey & GIS (8iQOd6RvhPL17pJd); Lake Superior Reserve (3IqwOyLwKDEqlRvQ) | c.susnik_lsreserve, c.wilson_lsreserve, d.erickson_lsreserve, dawaite_lsreserve, e.lockling_lsreserve, h.ramage_lsreserve, h.tracy_lsreserve, j.saari_lsreserve, k.reinl_lsreserve, k.rhude_lsreserve, karina.heim_lsreserve, katier@co.douglas.mn.us_DCPW, m.koutnik_lsreserve, m.starry_lsreserve, r.gray_lsreserve, r.joseph_lsreserve, rerhardt_lsreserve, s.geis_lsreserve, s.rybak_lsreserve | 526 | 129 | 53/12 |
| Hubbard | Hubbard County, Minnesota (auNjCUvKlkSqV04X) | Assessor_Hubbard, HubbardCounty, Sheriff_HubbardCounty, jack.bovee, jkeranen42 | 253 | 121 | 44/18 |
| Todd | County of Todd (rtnOAlmDm3Ccekyo) | BoltonMenk_LongPrairie, ToddGIS1, ToddHHS1 | 164 | 89 | 15/11 |
| Benton | Benton County, Minnesota (cHtpFLI4WlqULV8k) | BentonDrainageDB, BentonEM, BentonGIS, Eng_Tech, Land_Tech | 24 | 9 | 2/3 |
| Carlton | Carlton County, MN (GaVfJCelmMSe6faF); Town of Thomson, MN (WAQZc5nzGFL8vOVl) | BCaltrider_carltoncounty, CarltonCountyGIS, JHovi_carltoncounty, MWestphal_carltoncounty, ThomsonEskoGIS, mhalvorson_carltoncounty, pwa_carltoncounty | 386 | 136 | 64/13 |
| Crow Wing | Crow Wing County GIS Online (uqzY8RRiGhwsxu6K) | InternGIS_Brainerd, Patrick.Lyke, Steves, Tom.Strack, bHippert, cPlagge1, connorplagge, hHare24, jDrileck, jadams_cwccm, jafrie, joseph_peters_crowwingcounty, jschumann_brd, mBarrick, mSpringer24, mYoung6, mbrinks09, nKotaska, nate.r21, pwa_16, sAdebisi, sNorling25, sstrong, tTerrill26, tdeboer@baxtermn.gov | 563 | 240 | 51/8 |
| Itasca | Itasca County (JQNH4jUmOZFk3QzA) | ItascaSWCD, Itasca_GIS, Jason.Alstad@co.itasca.mn.us_ItascaCo, batpro99 | 107 | 59 | 23/14 |
| Mille Lacs | MILLE LACS COUNTY (msGTRvdwc9dcDoMX) | EnvSvcs_MILLELACS, MILLELACS | 77 | 28 | 4/3 |
| Morrison | None identified | None identified | 0 | 0 | 0/0 |
| Otter Tail | Otter Tail County, Minnesota (Pg1yLLk3jMuhxBKI) | George_Meyer, OTC_GIS_Services, Ottertail_GIS, Prowest_OTC, allen_otcgis, cpalmersheim_otcgis, jkrohn_otcgis, mandy.olson_otcgis, nyates_otcgis, sschake_otcgis | 400 | 124 | 30/9 |
| Clay | Clay County, MN (mS1vc6dGT4od9xCB) | ClayCountyMN, GIS.tech@claycountymn.gov_ClayCountyMN, Mark.Sloan_ClayCountyMN, Matthew.Jacobson@claycountymn.gov_claycountymn, NorthPointGIS_ClayCountyMN, ProWestGIS_ClayCountyMN, amanda.olson@claycountymn.gov_claycountymn, gis_ClayCountyMN, prowest_claymn | 302 | 84 | 15/10 |
| Polk | Polk County (O9tnbvDaQkJJ8hGN); POLK COUNTY LAND ASSET MANAGEMENT (2RIFco0Rk0YlWKga) | PolkCountyMN, PolkCountyWI, PolkGIS, colton.sorensen, dane.christenson.GISonline, smoe_PCG | 617 | 262 | 97/13 |
| Wilkin | Wilkin County (24KKFNDTiXmntYMH) | Assessor_WilkinCountyMN, Wilkin | 131 | 71 | 25/3 |
| Grant | None identified | None identified | 0 | 0 | 0/0 |
| Cook | Cook County Government (I5Or36sMcO7Y9vQ3);      Cook County, MN (L3KwVADPEG6iD24f) | Alexander.Stockdale@cookcountyil.gov_cookcountyil, CookCountyLibrarian, CookCountyMN, Cook_County_GIS, Daniel.Bartlett@cookcountyil.gov_cookcountyil, GISETL, James.Ziemba@cookcountyil.gov_cookcountyil, Kimberly.Kalosky@cookcountyil.gov_cookcountyil, Scott.Maginity@cookcountyil.gov_cookcountyil, Sigfrido.Gomez@cookcountyil.gov_cookcountyil, Stefano.Pannone@cookcountyil.gov_cookcountyil, alice.ferruzzi@cookcountyil.gov_cookcountyil, brittaney.harkness, brittaney.harkness@cookcountyil.gov_cookcountyil, david.arfa@cookcountyil.gov_cookcountyil, diana.krug@cookcountyil.gov_cookcountyil, ilena.hansel_cookcountymn, josh.kalov, josh.kalov@cookcountyil.gov_cookcountyil, lcastellanos@ckclerk.local_cookcountyil, mtostenson@cook, philip.larson_cookcountymn, todd.schuble@cookcountyil.gov_cookcountyil, todd.sobieck@cookcountyil.gov_cookcountyil, wig.ingente@cookcountyil.gov_cookcountyil | 1892 | 802 | 252/62 |
| Anoka | None identified | None identified | 0 | 0 | 0/0 |
| Hennepin | Hennepin County (ziLNoRgqnICUM0q1); City of Crystal, Minnesota (jzMkwbWtSouiZIE3); City of Minnetonka (vAmq2qjze38HN5HF) | Alec.Trenda@hennepincounty.gov_hennepin, Alex.Blenkush@hennepincounty.gov_hennepin, Anthony.Bauer@hennepincounty.gov_hennepin, Bradford.Roman@hennepincounty.gov_hennepin, Carl.Reim@hennepin.us_hennepin, Chris.Mavis@hennepin.us_hennepin, City_of_Minnetonka, Daniel.Wattenhofer@hennepin.us_hennepin, Donovan.Koxvold@hennepincounty.gov_hennepin, Eric.Hanson@hennepincounty.gov_hennepin, Heather.Albrecht@hennepincounty.gov_hennepin, Julian.Fernandez_Petersen@hennepin.us_hennepin, Lily.Kingsley@hennepin.us_hennepin, Maddy.Hohenstein@hennepin.us_hennepin, Madeline.Geitz@hennepin.us_hennepin, Meric.Birol@hennepincounty.gov_hennepin, Nathan.Graham@hennepincounty.gov_hennepin, Sarin.Strobush@hennepincounty.gov_hennepin, Tom.Houle@hennepin.us_hennepin, Warren.Fong@hennepincounty.gov_hennepin, fyang1774, hennepin.county.maps, mtkaLOGIS, mtkaRRooney, mtkaagorius, mtkaamorris, mtkacpetersen, mtkadei, mtkaegunderson, mtkagis, mtkagscherck, mtkairaber, mtkakjaeger, mtkaklarson, mtkaksjolander, mtkalkelley, mtkamcunningham, mtkamharding, mtkamreitter, schneideremily | 1252 | 452 | 92/37 |
| Ramsey | Ramsey County GIS AGOL Portal (527XtFVf9JKOTqu5) | Adam.Gardner@co.ramsey.mn.us_RamseyGIS, AhmadMojtoba.Riyadh@co.ramsey.mn.us_RamseyGIS, Amy.Barnstorff@co.ramsey.mn.us_RamseyGIS, Andrea.Flores_Hernan@co.ramsey.mn.us_RamseyGIS, Anna.Windels@co.ramsey.mn.us_RamseyGIS, Ava.Larson@co.ramsey.mn.us_RamseyGIS, Brook.Anderson@co.ramsey.mn.us_RamseyGIS, Carmel.SanJuan@co.ramsey.mn.us_RamseyGIS, Codie.Leseman@co.ramsey.mn.us_RamseyGIS, EAMData, Edward.Rutledge@co.ramsey.mn.us_RamseyGIS, Kate.Seeger@co.ramsey.mn.us_RamseyGIS, Kendall.Bobula@co.ramsey.mn.us_RamseyGIS, Madeline.Fourness@co.ramsey.mn.us_RamseyGIS, Matthew.Gallo@co.ramsey.mn.us_RamseyGIS, Nicholai.JostEpp@co.ramsey.mn.us_RamseyGIS, Olivia.Jensen@co.ramsey.mn.us_RamseyGIS, RCGISAdmin, aaron.thielen@co.ramsey.mn.us_RamseyGIS, christina.ulrich@co.ramsey.mn.us_RamseyGIS, daniel.baar@co.ramsey.mn.us_RamseyGIS, james.lystad@co.ramsey.mn.us_RamseyGIS, jeffrey.kalar@co.ramsey.mn.us_RamseyGIS, justin.townsend@co.ramsey.mn.us_RamseyGIS, karma.kumlin_diers@co.ramsey.mn.us_RamseyGIS, vic.barnett@co.ramsey.mn.us_RamseyGIS | 514 | 224 | 56/11 |
| Washington | Washington County, MN (3fjYPqJf7qalQMlb) | AMGUILD, Alissa.Lopez_WCMN, CBSCHAE, CJNEPER1, DMMACSW, Gabruns, HistoricCourthouse_WCMN, JJWILLI, JSWASMU, KMPETER, ParksGuestServices_wcmn, SKEISEN, SXRAKSH, TLDALE, Washington_County_MN, adam.snegosky, adriana.atcheson_wcmn, andrea.rehm_wcmn, ann.bensen_WCMN, ctparen, dcbrand, ddmatze, stephen.krech_WCMN, tsieben | 2262 | 1138 | 107/14 |
| Wright | Wright County GIS (CiQCvRGImIxsaFnM) | ARM4254, DrainageDB_HEI_Wright, WrightCountySurveyorDept, WrightCounty_HHS, lmw4130, wrightcountygis | 454 | 180 | 89/19 |
| Sherburne | Sherburne County GIS (A86cpFIY5mfMGCej) | Brett.Forbes@co.sherburne.mn.us_SherburneGIS, Jenna.Walz@co.sherburne.mn.us_SherburneGIS, Jodi.Heurung_Dick@co.sherburne.mn.us_SherburneGIS, Leah.Krotzer@co.sherburne.mn.us_SherburneGIS, Melissa.Gearman@co.sherburne.mn.us_SherburneGIS, SherburneGIS | 538 | 288 | 74/12 |
| Isanti | Isanti County (8oXJ0xFdajDkQ6Xz) | IC.GIS.Admin, NateKirkwold, ProWest_IsantiCo | 161 | 80 | 33/6 |
| Chisago | Chisago County (KhhQFOpbD3jwYzFF) | Chisago_MICS | 57 | 38 | 12/11 |
| Stearns | None identified | stearns_gis | 435 | 171 | 28/6 |
| St. Louis | St. Louis County, Minnesota (PBz5hDp35DPCX9Xs) | ASR-GIS, AsperheimK@stlouiscountymn.gov_slcgis, AxfordA@stlouiscountymn.gov_slcgis, BestA@stlouiscountymn.gov_slcgis, BoyumS@stlouiscountymn.gov_slcgis, EGIS-GIS, GoodmanM@stlouiscountymn.gov_slcgis, HaydenA@stlouiscountymn.gov_slcgis, KariT@stlouiscountymn.gov_slcgis, KnutsonG@stlouiscountymn.gov_slcgis, LattnerJ@stlouiscountymn.gov_slcgis, LundgrenA@stlouiscountymn.gov_slcgis, McAlearT@stlouiscountymn.gov_slcgis, McPheeE@stlouiscountymn.gov_slcgis, NelsonM1@stlouiscountymn.gov_slcgis, ProseR@stlouiscountymn.gov_slcgis, SLC_GIS_PublicWorks, StovernR@stlouiscountymn.gov_slcgis, auditor_elections, grohnb@stlouiscountymn.gov_slcgis | 717 | 199 | 62/6 |
| Lake | Red Lake County, Minnesota (wpBS79gOlaiMcd4T) | RedLakeCountyMN | 23 | 16 | 0/4 |
| Cass | None identified | None identified | 0 | 0 | 0/0 |
| Clearwater | None identified | None identified | 0 | 0 | 0/0 |
| Mahnomen | Mahnomen County (eORKbx5CWReJmkoa) | MahnomenCountyMN | 30 | 16 | 6/6 |
| Red Lake | Red Lake County, Minnesota (wpBS79gOlaiMcd4T) | RedLakeCountyMN | 23 | 16 | 0/4 |
| Kanabec | None identified | None identified | 0 | 0 | 0/0 |
| Kittson | None identified | None identified | 0 | 0 | 0/0 |
| Koochiching | None identified | None identified | 0 | 0 | 0/0 |
| Lake of the Woods | Lake of the Woods County (6np4vgH79wKPMG9C) | First.Responder, mis.tech | 42 | 26 | 6/6 |
| Marshall | Marshall County (2xTdydNd4vmUDZms) | MarshallCountyMN | 26 | 16 | 9/2 |
| Norman | Norman County (AqiQG5wpznJskPy1) | NormanCounty | 15 | 13 | 2/4 |
| Pennington | None identified | None identified | 0 | 0 | 0/0 |
| Pine | None identified | None identified | 0 | 0 | 0/0 |
| Roseau | None identified | None identified | 0 | 0 | 0/0 |
| Wadena | None identified | None identified | 0 | 0 | 0/0 |
| Dakota | Dakota County (CfhoRi2v351nuUH7) | BBZU3_DakotaCounty, BKNX6_DakotaCounty, BMWU7_DakotaCounty, CLMO2_DakotaCounty, CPF21_DakotaCounty, CUGH8_DakotaCounty, DHRF1_DakotaCounty, GIS_DakotaCounty, JMYU5_DakotaCounty, JSNM5_DakotaCounty, LLAI7_DakotaCounty, MBCQ4_DakotaCounty, MHRF0_DakotaCounty, MMAB3_DakotaCounty, MPIR5_DakotaCounty, SKGL5_DakotaCounty, SLTD0_DakotaCounty, SMFI3_DakotaCounty, STRT3_DakotaCounty, TLSH0_DakotaCounty, VGQM2_DakotaCounty | 1032 | 381 | 119/61 |
| Lyon | Lyon County, Minnesota (WSCKzjfnubMgUOk8) | DrainageDB_HEI_Lyon, LyonMNGIS | 91 | 39 | 8/2 |
| McLeod | None identified | None identified | 0 | 0 | 0/0 |
| Rice | Rice County, MN (EXmjskXJEd1IH32l) | drainagedb_hei_rice, jacob.butler@ricecountymn.gov, jeremy.edwards@ricecountymn.gov, mtrager@co.rice.mn.us, rcgis@ricecountymn.gov, samuel.nelson@ricecountymn.gov | 138 | 91 | 16/10 |
| Steele | Steele County MN (PhDlW50qzuHSLgLK) | DrainageDB_HEI_Steele, GIS_Steele, SteeleCoGIS, alison.ellingson, nflatgard | 154 | 81 | 40/4 |
| Carver | Carver County, Minnesota (wMZT8kNwa6tOxhKg) | CarverCounty, CarverCountyPW, CarverGIS, CarverLink, JSorensen1, acarter@carvercountymn.gov_carver, adickhart@carvercountymn.gov_carver, aedgcumbe@carvercountymn.gov_carver, aheger, akampbell@carvercountymn.gov_carver, akuhlmann@victoriamn.gov, americkson@carvercountymn.gov_carver, balcott@chaskamn.com, bhanzel@carvercountymn.gov_carver, brutter@carvercountymn.gov_carver, chaska_admin, cologne_admin, cprisland@carvercountymn.gov_carver, criley@carvercountymn.gov_carver, dheidinger@carvercountymn.gov_carver, dtumberg_chan, economicdev@cityofnya.com, jclark@waconiamn.gov, jhansen_chan, klarson@carvercountymn.gov_carver, kwright@chaskamn.com, lsluser_waconia, mrantala@carvercountymn.gov_carver, mseveland@carvercountymn.gov_carver, nkabat, nya_admin, pclark@carvercountymn.gov_carver, phenschel@carvercountymn.gov_carver, pmoline@carvercountymn.gov_carver, sdowns@carvercountymn.gov_carver, sporrez@waconiamn.gov, tsundby@carvercountymn.gov_carver, victoria_admin, waconia_admin, watertown_admin | 3576 | 2472 | 229/32 |
| Scott | Scott County Minnesota (DqIh9WAsIZcPlBEF) | HEIDrainageDB, ScottCountyGIS, alolson@co.scott.mn.us_ScottCounty, ebjelland@co.scott.mn.us_ScottCounty, etran@co.scott.mn.us_ScottCounty, pthorsel | 527 | 214 | 47/23 |
| Wabasha | Wabasha County GIS (oAqLpd7WRllWyIbW) | sgertken | 15 | 6 | 4/1 |
| Big Stone | Big Stone County (W9NtgmEXTNYySaSq) | BigStoneCountyMN | 78 | 48 | 16/11 |
| Brown | None identified | None identified | 0 | 0 | 0/0 |
| Chippewa | Chippewa County (SnCfeG9WCK26XimW) | ChippewaCountyMN, swilliams_chippewa | 57 | 31 | 9/3 |
| Lac qui Parle | None identified | lqprecorder | 33 | 15 | 10/3 |
| Meeker | None identified | None identified | 0 | 0 | 0/0 |
| Mower | Mower County, MN (WpaOptirDnb1fPwm) | KeithB@Mower, MowerCountyArcGISOnline | 156 | 48 | 23/13 |
| Pipestone | Pipestone County (BmOPNud8bDJ12jtE) | PipestoneCountyMN, kkrier, mark.volz2021 | 48 | 27 | 19/5 |
| Pope | None identified | None identified | 0 | 0 | 0/0 |
| Renville | ArcGIS Online (bEOhwGpTpOM9eaNX) | RenvilleCounty | 125 | 42 | 17/6 |
| Stevens | Stevens County (7iPhaYyq6PkRoVhV) | StevensChristenson | 60 | 20 | 6/3 |
| Traverse | Traverse County (ZsznUNm2hwhFbh1Y) | TraverseCountyMN | 30 | 18 | 9/5 |
| Waseca | Waseca Co. (cKZFhBpuyHs37NOa) | DrainageDB_HEI_Waseca, chris.howard_wasecacounty, schneider_waseca | 52 | 7 | 5/2 |
| Yellow Medicine | None identified | None identified | 0 | 0 | 0/0 |
| Dodge | None identified | None identified | 0 | 0 | 0/0 |
| Goodhue | Goodhue County Online Maps (zCDVc272xQCnwjzc) | CloudAGOL_Admin, bryan.byholm_GoodhueCo, leanne.knott28, melissa.devetter_DodgeCo, savannah.domnie_goodhueco | 403 | 235 | 81/3 |
| Lincoln | None identified | LINCMN | 18 | 4 | 1/4 |
| Olmsted | Olmsted County Geographic Information Systems (tC18nF87RnYBtzwI) | Jan_Chezick, OC08731@co.olmsted.mn.us_GIS_Olmsted, OC08986@co.olmsted.mn.us_GIS_Olmsted, OC09308@co.olmsted.mn.us_GIS_Olmsted, OC09397@co.olmsted.mn.us_GIS_Olmsted, OC09569@co.olmsted.mn.us_GIS_Olmsted, OC10020@co.olmsted.mn.us_GIS_Olmsted, OC10168@co.olmsted.mn.us_GIS_Olmsted, OC10300@co.olmsted.mn.us_GIS_Olmsted, OC10358@co.olmsted.mn.us_GIS_Olmsted, OC10370@co.olmsted.mn.us_GIS_Olmsted, OC10400@co.olmsted.mn.us_GIS_Olmsted, OC10462@co.olmsted.mn.us_GIS_Olmsted, OC10475@co.olmsted.mn.us_GIS_Olmsted, OC10547@co.olmsted.mn.us_GIS_Olmsted, OC10555@co.olmsted.mn.us_GIS_Olmsted, OC10583@co.olmsted.mn.us_GIS_Olmsted, OC10673@co.olmsted.mn.us_GIS_Olmsted, OC10689@co.olmsted.mn.us_GIS_Olmsted, OC10755@co.olmsted.mn.us_GIS_Olmsted, OC10759@co.olmsted.mn.us_GIS_Olmsted, OC10803@co.olmsted.mn.us_GIS_Olmsted, OC10953@co.olmsted.mn.us_GIS_Olmsted, OC11043@co.olmsted.mn.us_GIS_Olmsted, OC11062@co.olmsted.mn.us_GIS_Olmsted, phelclem@co.olmsted.mn.us_GIS_Olmsted, plamshee@co.olmsted.mn.us_GIS_Olmsted, plasgosl@co.olmsted.mn.us_GIS_Olmsted, pwacmeye@co.olmsted.mn.us_GIS_Olmsted | 1184 | 566 | 47/9 |
| Sibley | Sibley County GIS (ca9pZxSKQMiPIqAL) | DrainageDB_HEI_Sibley, SibleyGIS | 184 | 32 | 7/1 |
| Kandiyohi | None identified | None identified | 0 | 0 | 0/0 |
| Rock | None identified | None identified | 0 | 0 | 0/0 |
| Fillmore | Fillmore County (3x9exxBaH0fQHR1s) | FillmoreCountyMN, NWheeler_FillmoreCo | 63 | 26 | 9/5 |
| Houston | None identified | None identified | 0 | 0 | 0/0 |
| Winona | None identified | None identified | 0 | 0 | 0/0 |
| Le Sueur | Le Sueur County, MN (sc5vWAWqbZRsgaBb) | DrainageDB_HEI_LeSueur, Tyler_LeSueur, acolling_LSCMN, gphillips_LSCMN, hbushman_LSCMN, lscadmin | 120 | 59 | 23/4 |
| Murray | None identified | None identified | 0 | 0 | 0/0 |
| Blue Earth | Blue Earth County (sZnXR7hFyzOmRFuI) | BlueEarthCounty, DrainageDB_HEI_BEC, darrinhaeder, jgravesbec, ssalsbury3 | 260 | 88 | 76/14 |
| Cottonwood | Cottonwood County GIS Services (HWNeJO1BX8XvS0O8) | CottonwoodCounty, DrainageDB_HEI_CW, bbuchholz, breanna.wagner_CottCoGIS, dylan.oeltjenbruns_CottCoGIS, jen.muchlinski_cottcogis, nathan.harder_CottCoGIS | 91 | 30 | 5/3 |
| Faribault | Faribault County (fxB2C8mQfjMb1848) | Faribault2020, FaribaultCountyMN | 113 | 55 | 18/4 |
| Freeborn | None identified | None identified | 0 | 0 | 0/0 |
| Jackson | Jackson County MN GIS (48kcymtZKUOOXIj8) | Ben.Shelstad_JacksonCoMNGIS, JacksonCoGIS, nodgren_jacksoncomngis | 73 | 41 | 13/2 |
| Martin | None identified | None identified | 0 | 0 | 0/0 |
| Nicollet | None identified | drunck9 | 129 | 55 | 9/5 |
| Nobles | None identified | None identified | 0 | 0 | 0/0 |
| Redwood | Redwood County (CwLPl749ngyCGysF) | bkRedwood01 | 54 | 13 | 7/3 |
| Swift | None identified | None identified | 0 | 0 | 0/0 |
| Watonwan | None identified | riaan.swart | 49 | 49 | 24/15 |

## Interpretation

An organization match is accepted only when the public ArcGIS organization name/description identifies both the county and Minnesota. `None identified` does not mean the county lacks GIS; it means the audit did not find a qualifying ArcGIS Online organization. Official county Enterprise services and county-controlled external viewers remain recorded elsewhere in the registry.

