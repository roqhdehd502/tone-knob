import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface MediaRegion {
  id: string;
  name: string;
  url: string;
  wsUrl: string;
  latitude: number;
  longitude: number;
  healthy: boolean;
  latencyMs?: number;
}

@Injectable()
export class RegionService {
  private readonly logger = new Logger(RegionService.name);

  private readonly regions: MediaRegion[];

  constructor(private readonly configService: ConfigService) {
    this.regions = this.loadRegionsFromConfig();
  }

  // 클라이언트 IP/위치 기반 최적 리전 반환
  selectRegion(clientLatitude?: number, clientLongitude?: number): MediaRegion {
    const healthy = this.regions.filter((r) => r.healthy);
    if (healthy.length === 0) {
      throw new Error("사용 가능한 미디어 서버 리전이 없습니다");
    }

    if (clientLatitude == null || clientLongitude == null) {
      return healthy[0];
    }

    // 가장 가까운 리전 선택 (Haversine 거리)
    let nearest = healthy[0];
    let minDist = this.haversine(
      clientLatitude,
      clientLongitude,
      nearest.latitude,
      nearest.longitude,
    );

    for (const region of healthy.slice(1)) {
      const dist = this.haversine(
        clientLatitude,
        clientLongitude,
        region.latitude,
        region.longitude,
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = region;
      }
    }

    return nearest;
  }

  getAllRegions(): MediaRegion[] {
    return this.regions;
  }

  getRegionById(id: string): MediaRegion | undefined {
    return this.regions.find((r) => r.id === id);
  }

  // 리전 헬스체크 (배포 환경에서 주기적으로 호출)
  async checkHealth(): Promise<void> {
    await Promise.all(
      this.regions.map(async (region) => {
        try {
          const start = Date.now();
          const res = await fetch(`${region.url}/health`, {
            signal: AbortSignal.timeout(3000),
          });
          region.healthy = res.ok;
          region.latencyMs = Date.now() - start;
        } catch {
          region.healthy = false;
          region.latencyMs = undefined;
          this.logger.warn(`Region ${region.id} health check failed`);
        }
      }),
    );
  }

  private loadRegionsFromConfig(): MediaRegion[] {
    // 환경변수 MEDIA_REGIONS_JSON 으로 재정의 가능
    const override = this.configService.get<string>("MEDIA_REGIONS_JSON");
    if (override) {
      try {
        return JSON.parse(override) as MediaRegion[];
      } catch {
        this.logger.warn("MEDIA_REGIONS_JSON parse failed, using defaults");
      }
    }

    return [
      {
        id: "ap-northeast-1",
        name: "서울 (ap-northeast-1)",
        url: this.configService.get("MEDIA_SERVER_URL_AP1", "http://localhost:3002"),
        wsUrl: this.configService.get("MEDIA_WS_URL_AP1", "ws://localhost:3002"),
        latitude: 37.5665,
        longitude: 126.978,
        healthy: true,
      },
      {
        id: "us-west-2",
        name: "오레곤 (us-west-2)",
        url: this.configService.get("MEDIA_SERVER_URL_US1", "http://localhost:3003"),
        wsUrl: this.configService.get("MEDIA_WS_URL_US1", "ws://localhost:3003"),
        latitude: 45.5231,
        longitude: -122.6765,
        healthy: true,
      },
      {
        id: "eu-west-1",
        name: "아일랜드 (eu-west-1)",
        url: this.configService.get("MEDIA_SERVER_URL_EU1", "http://localhost:3004"),
        wsUrl: this.configService.get("MEDIA_WS_URL_EU1", "ws://localhost:3004"),
        latitude: 53.3498,
        longitude: -6.2603,
        healthy: true,
      },
    ];
  }

  // Haversine 공식으로 두 지점 간 거리 계산 (km)
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
