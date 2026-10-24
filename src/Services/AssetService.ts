import type { AssetId, LibraryAsset } from "@/Protocols/AssetProtocol.ts";
import { SuggestUtil } from "@/Utils/SuggestUtil.ts";
import { PersonAsset } from "@/Resources/Assets/PersonAsset.ts";
import { HouseAsset } from "@/Resources/Assets/HouseAsset.ts";
import { TreeAsset } from "@/Resources/Assets/TreeAsset.ts";
import { PineAsset } from "@/Resources/Assets/PineAsset.ts";
import { PalmAsset } from "@/Resources/Assets/PalmAsset.ts";
import { BushAsset } from "@/Resources/Assets/BushAsset.ts";
import { FlowersAsset } from "@/Resources/Assets/FlowersAsset.ts";
import { FenceAsset } from "@/Resources/Assets/FenceAsset.ts";
import { BuildingAsset } from "@/Resources/Assets/BuildingAsset.ts";
import { MountainAsset } from "@/Resources/Assets/MountainAsset.ts";
import { SunAsset } from "@/Resources/Assets/SunAsset.ts";
import { MoonAsset } from "@/Resources/Assets/MoonAsset.ts";
import { CloudAsset } from "@/Resources/Assets/CloudAsset.ts";
import { BirdAsset } from "@/Resources/Assets/BirdAsset.ts";
import { StarAsset } from "@/Resources/Assets/StarAsset.ts";
import { StarsAsset } from "@/Resources/Assets/StarsAsset.ts";
import { CarAsset } from "@/Resources/Assets/CarAsset.ts";
import { BicycleAsset } from "@/Resources/Assets/BicycleAsset.ts";
import { DogAsset } from "@/Resources/Assets/DogAsset.ts";
import { CatAsset } from "@/Resources/Assets/CatAsset.ts";
import { StreetlightAsset } from "@/Resources/Assets/StreetlightAsset.ts";
import { BenchAsset } from "@/Resources/Assets/BenchAsset.ts";
import { WindowAsset } from "@/Resources/Assets/WindowAsset.ts";
import { FrameAsset } from "@/Resources/Assets/FrameAsset.ts";
import { ClockAsset } from "@/Resources/Assets/ClockAsset.ts";
import { BoardAsset } from "@/Resources/Assets/BoardAsset.ts";
import { ShelfWallAsset } from "@/Resources/Assets/ShelfWallAsset.ts";
import { BookshelfAsset } from "@/Resources/Assets/BookshelfAsset.ts";
import { DeskAsset } from "@/Resources/Assets/DeskAsset.ts";
import { TableAsset } from "@/Resources/Assets/TableAsset.ts";
import { CounterAsset } from "@/Resources/Assets/CounterAsset.ts";
import { ChairAsset } from "@/Resources/Assets/ChairAsset.ts";
import { SofaAsset } from "@/Resources/Assets/SofaAsset.ts";
import { BedAsset } from "@/Resources/Assets/BedAsset.ts";
import { TvAsset } from "@/Resources/Assets/TvAsset.ts";
import { TvStandAsset } from "@/Resources/Assets/TvStandAsset.ts";
import { FloorLampAsset } from "@/Resources/Assets/FloorLampAsset.ts";
import { RugAsset } from "@/Resources/Assets/RugAsset.ts";
import { PendantLampAsset } from "@/Resources/Assets/PendantLampAsset.ts";
import { LaptopAsset } from "@/Resources/Assets/LaptopAsset.ts";
import { MonitorAsset } from "@/Resources/Assets/MonitorAsset.ts";
import { LampAsset } from "@/Resources/Assets/LampAsset.ts";
import { PlantAsset } from "@/Resources/Assets/PlantAsset.ts";
import { BigPlantAsset } from "@/Resources/Assets/BigPlantAsset.ts";
import { CupAsset } from "@/Resources/Assets/CupAsset.ts";
import { CakeAsset } from "@/Resources/Assets/CakeAsset.ts";
import { PizzaAsset } from "@/Resources/Assets/PizzaAsset.ts";
import { FruitBowlAsset } from "@/Resources/Assets/FruitBowlAsset.ts";
import { BurgerAsset } from "@/Resources/Assets/BurgerAsset.ts";
import { PlateAsset } from "@/Resources/Assets/PlateAsset.ts";
import { VaseFlowersAsset } from "@/Resources/Assets/VaseFlowersAsset.ts";
import { BooksAsset } from "@/Resources/Assets/BooksAsset.ts";
import { CoffeeMachineAsset } from "@/Resources/Assets/CoffeeMachineAsset.ts";
import { UmbrellaAsset } from "@/Resources/Assets/UmbrellaAsset.ts";
import { BoatAsset } from "@/Resources/Assets/BoatAsset.ts";
import { SuitcaseAsset } from "@/Resources/Assets/SuitcaseAsset.ts";
import { BackpackAsset } from "@/Resources/Assets/BackpackAsset.ts";
import { BeachTowelAsset } from "@/Resources/Assets/BeachTowelAsset.ts";
import { BallAsset } from "@/Resources/Assets/BallAsset.ts";
import { SandcastleAsset } from "@/Resources/Assets/SandcastleAsset.ts";
import { SchoolAsset } from "@/Resources/Assets/SchoolAsset.ts";
import { UniversityAsset } from "@/Resources/Assets/UniversityAsset.ts";
import { LabAsset } from "@/Resources/Assets/LabAsset.ts";
import { StageAsset } from "@/Resources/Assets/StageAsset.ts";
import { FinishFlagAsset } from "@/Resources/Assets/FinishFlagAsset.ts";
import { PennantAsset } from "@/Resources/Assets/PennantAsset.ts";
import { BalloonsAsset } from "@/Resources/Assets/BalloonsAsset.ts";
import { DiplomaAsset } from "@/Resources/Assets/DiplomaAsset.ts";
import { TrophyAsset } from "@/Resources/Assets/TrophyAsset.ts";
import { DeskSlabAsset } from "@/Resources/Assets/DeskSlabAsset.ts";
import { DrawerUnitAsset } from "@/Resources/Assets/DrawerUnitAsset.ts";
import { CabinetAsset } from "@/Resources/Assets/CabinetAsset.ts";
import { RollingCartAsset } from "@/Resources/Assets/RollingCartAsset.ts";
import { TrashCanAsset } from "@/Resources/Assets/TrashCanAsset.ts";
import { OfficeChairAsset } from "@/Resources/Assets/OfficeChairAsset.ts";
import { LaptopOpenAsset } from "@/Resources/Assets/LaptopOpenAsset.ts";
import { HeadphonesAsset } from "@/Resources/Assets/HeadphonesAsset.ts";
import { CapAsset } from "@/Resources/Assets/CapAsset.ts";
import { PhotoFrameAsset } from "@/Resources/Assets/PhotoFrameAsset.ts";
import { FigurineAsset } from "@/Resources/Assets/FigurineAsset.ts";
import { TumblerAsset } from "@/Resources/Assets/TumblerAsset.ts";
import { PaperCupAsset } from "@/Resources/Assets/PaperCupAsset.ts";
import { PlasticBagAsset } from "@/Resources/Assets/PlasticBagAsset.ts";
import { CablesAsset } from "@/Resources/Assets/CablesAsset.ts";
import { LightSwitchAsset } from "@/Resources/Assets/LightSwitchAsset.ts";
import { GlassShelfAsset } from "@/Resources/Assets/GlassShelfAsset.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";

// Biblioteca de assets (estilo próprio, flat com segunda tonalidade de luz/sombra).
// Cada asset desenha em unidades (pessoa em pé = 100), com origem no centro da base
// (y negativo = para cima). Metadados: kind (onde pode ficar), w/h (caixa),
// top (altura da superfície de apoio), seat (altura do assento), tags (sinônimos).

export interface AssetResolution {
  id: string | null;
  suggest?: string[];
}

export class AssetService {
  private static indexById(assets: BaseAsset[]): Record<AssetId, BaseAsset> {
    const index: Partial<Record<AssetId, BaseAsset>> = {};
    for (const asset of assets) {
      index[asset.id] = asset;
    }
    // Why: AssetService.test.ts checks that every id in ASSET_IDS has a registered asset.
    return index as Record<AssetId, BaseAsset>;
  }

  private static readonly CANDIDATE_POOL = 6;

  private static readonly SUGGESTION_COUNT = 3;

  static readonly ASSETS: Record<AssetId, BaseAsset> = AssetService.indexById(
    [new PersonAsset(), new HouseAsset(), new TreeAsset(), new PineAsset(), new PalmAsset(), new BushAsset(), new FlowersAsset(), new FenceAsset(), new BuildingAsset(), new MountainAsset(), new SunAsset(), new MoonAsset(), new CloudAsset(), new BirdAsset(), new StarAsset(), new StarsAsset(), new CarAsset(), new BicycleAsset(), new DogAsset(), new CatAsset(), new StreetlightAsset(), new BenchAsset(), new WindowAsset(), new FrameAsset(), new ClockAsset(), new BoardAsset(), new ShelfWallAsset(), new BookshelfAsset(), new DeskAsset(), new TableAsset(), new CounterAsset(), new ChairAsset(), new SofaAsset(), new BedAsset(), new TvAsset(), new TvStandAsset(), new FloorLampAsset(), new RugAsset(), new PendantLampAsset(), new LaptopAsset(), new MonitorAsset(), new LampAsset(), new PlantAsset(), new BigPlantAsset(), new CupAsset(), new CakeAsset(), new PizzaAsset(), new FruitBowlAsset(), new BurgerAsset(), new PlateAsset(), new VaseFlowersAsset(), new BooksAsset(), new CoffeeMachineAsset(), new UmbrellaAsset(), new BoatAsset(), new SuitcaseAsset(), new BackpackAsset(), new BeachTowelAsset(), new BallAsset(), new SandcastleAsset(), new SchoolAsset(), new UniversityAsset(), new LabAsset(), new StageAsset(), new FinishFlagAsset(), new PennantAsset(), new BalloonsAsset(), new DiplomaAsset(), new TrophyAsset(), new DeskSlabAsset(), new DrawerUnitAsset(), new CabinetAsset(), new RollingCartAsset(), new TrashCanAsset(), new OfficeChairAsset(), new LaptopOpenAsset(), new HeadphonesAsset(), new CapAsset(), new PhotoFrameAsset(), new FigurineAsset(), new TumblerAsset(), new PaperCupAsset(), new PlasticBagAsset(), new CablesAsset(), new LightSwitchAsset(), new GlassShelfAsset()],
  );

  static resolveAsset(name: string, library: Record<string, LibraryAsset> = AssetService.ASSETS): AssetResolution {
    if (library[name]) {
      return { id: name };
    }
    const lowered = name.toLowerCase();
    const byTag = Object.entries(library).find(([, asset]) => (asset.tags ?? []).includes(lowered));
    if (byTag) {
      return { id: byTag[0] };
    }
    const candidates: Array<[number, string]> = [];
    for (const [id, asset] of Object.entries(library)) {
      for (const key of [id, ...(asset.tags ?? [])]) {
        candidates.push([SuggestUtil.distance(lowered, key), id]);
      }
    }
    candidates.sort((first, second) => first[0] - second[0]);
    const nearest = candidates.slice(0, AssetService.CANDIDATE_POOL).map((candidate) => candidate[1]);
    return { id: null, suggest: [...new Set(nearest)].slice(0, AssetService.SUGGESTION_COUNT) };
  }
}
