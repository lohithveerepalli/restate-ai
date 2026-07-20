"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStudioStore } from "@/stores/studio-store";
import { CESIUM_BASE_URL } from "@/lib/constants";
import { DEFAULT_CAMERA } from "@/types";
import { setTimeFromHours } from "@/lib/cesium/helpers";
import {
  calculateAreaAcres,
  calculateCentroid,
  haversineDistanceMeters,
} from "@/lib/geo";
import type { BasemapStyle, PolygonPoint } from "@/types";

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

async function applyBasemap(
  Cesium: typeof import("cesium"),
  viewer: import("cesium").Viewer,
  style: BasemapStyle,
  showLabels: boolean
) {
  viewer.imageryLayers.removeAll();

  const addUrl = (url: string, maxLevel = 19) => {
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url,
        maximumLevel: maxLevel,
        credit: "© Map data providers",
      })
    );
  };

  if (style === "streets") {
    // Carto Voyager — clear city/road labels for navigation
    addUrl(
      "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
      20
    );
  } else if (style === "satellite") {
    addUrl(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      19
    );
  } else {
    // hybrid: satellite + place/road labels
    addUrl(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      19
    );
    if (showLabels) {
      addUrl(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        19
      );
      addUrl(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        19
      );
    }
  }
}

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<import("cesium").Viewer | null>(null);
  const cesiumRef = useRef<typeof import("cesium") | null>(null);
  const polygonEntityRef = useRef<import("cesium").Entity | null>(null);
  const pointEntitiesRef = useRef<import("cesium").Entity[]>([]);
  const modelEntityRef = useRef<import("cesium").Entity | null>(null);
  const measureEntitiesRef = useRef<import("cesium").Entity[]>([]);
  const handlerRef = useRef<import("cesium").ScreenSpaceEventHandler | null>(
    null
  );
  const tilesetRef = useRef<import("cesium").Cesium3DTileset | null>(null);
  const lastModelUrl = useRef<string | null>(null);

  const mode = useStudioStore((s) => s.mode);
  const polygon = useStudioStore((s) => s.polygon);
  const isPolygonClosed = useStudioStore((s) => s.isPolygonClosed);
  const layers = useStudioStore((s) => s.layers);
  const basemap = useStudioStore((s) => s.basemap);
  const timeOfDay = useStudioStore((s) => s.timeOfDay);
  const modelUrl = useStudioStore((s) => s.modelUrl);
  const modelTransform = useStudioStore((s) => s.modelTransform);
  const centroid = useStudioStore((s) => s.centroid);
  const measurePoints = useStudioStore((s) => s.measurePoints);
  const pendingCameraPreset = useStudioStore((s) => s.pendingCameraPreset);
  const flyToRequest = useStudioStore((s) => s.flyToRequest);
  const navAction = useStudioStore((s) => s.navAction);

  const addPolygonPoint = useStudioStore((s) => s.addPolygonPoint);
  const closePolygon = useStudioStore((s) => s.closePolygon);
  const setMapReady = useStudioStore((s) => s.setMapReady);
  const addMeasurePoint = useStudioStore((s) => s.addMeasurePoint);
  const setMeasurePoints = useStudioStore((s) => s.setMeasurePoints);
  const clearCameraPreset = useStudioStore((s) => s.clearCameraPreset);
  const clearFlyTo = useStudioStore((s) => s.clearFlyTo);
  const clearNav = useStudioStore((s) => s.clearNav);
  const setTimeOfDay = useStudioStore((s) => s.setTimeOfDay);
  const setCameraCenter = useStudioStore((s) => s.setCameraCenter);

  // Initialize Cesium
  useEffect(() => {
    let destroyed = false;
    let centerTimer: ReturnType<typeof setInterval> | null = null;

    async function init() {
      if (!containerRef.current || viewerRef.current) return;

      window.CESIUM_BASE_URL = CESIUM_BASE_URL;

      const Cesium = await import("cesium");
      await import("cesium/Build/Cesium/Widgets/widgets.css");
      if (destroyed) return;

      cesiumRef.current = Cesium;

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (apiKey && Cesium.GoogleMaps) {
        Cesium.GoogleMaps.defaultApiKey = apiKey;
      }

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: apiKey ? Cesium.IonGeocodeProviderType.GOOGLE : false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        creditContainer: document.createElement("div"),
        terrain: undefined,
        baseLayer: false,
      });

      try {
        const geocoder = containerRef.current.querySelector(
          ".cesium-viewer-geocoderContainer"
        );
        if (geocoder instanceof HTMLElement) geocoder.style.display = "none";
      } catch {
        /* ignore */
      }

      viewer.scene.globe.show = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1220");
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#050a14");
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.00015;
      viewer.scene.skyAtmosphere!.show = true;
      viewer.shadows = true;
      viewer.terrainShadows = Cesium.ShadowMode.RECEIVE_ONLY;
      viewer.shadowMap.softShadows = true;
      viewer.shadowMap.size = 2048;

      // Labeled basemap first so city names always show for navigation
      const style = useStudioStore.getState().basemap;
      const labels = useStudioStore.getState().layers.labels;
      await applyBasemap(Cesium, viewer, style, labels);

      // Optional Google Photorealistic 3D (keeps basemap labels under/around)
      if (apiKey) {
        try {
          const tileset = await Cesium.createGooglePhotorealistic3DTileset(
            { key: apiKey, onlyUsingWithGoogleGeocoder: true },
            { showCreditsOnScreen: false }
          );
          viewer.scene.primitives.add(tileset);
          tilesetRef.current = tileset;
          // Keep globe + labels visible under sparse 3D tile coverage
          viewer.scene.globe.show = true;
          console.info("[Restate] Google Photorealistic 3D Tiles loaded");
        } catch (e) {
          console.warn(
            "[Restate] 3D Tiles unavailable — using labeled satellite/streets basemap.",
            e
          );
        }
      }

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          DEFAULT_CAMERA.longitude,
          DEFAULT_CAMERA.latitude,
          DEFAULT_CAMERA.height
        ),
        orientation: {
          heading: Cesium.Math.toRadians(DEFAULT_CAMERA.heading),
          pitch: Cesium.Math.toRadians(DEFAULT_CAMERA.pitch),
          roll: DEFAULT_CAMERA.roll,
        },
      });

      setTimeFromHours(Cesium, viewer.clock, 14);
      viewer.scene.light = new Cesium.SunLight();

      const ctrl = viewer.scene.screenSpaceCameraController;
      ctrl.inertiaSpin = 0.9;
      ctrl.inertiaTranslate = 0.9;
      ctrl.inertiaZoom = 0.8;
      ctrl.minimumZoomDistance = 15;
      ctrl.maximumZoomDistance = 20_000_000;
      // Friendlier controls: left rotate, right pan, middle/scroll zoom
      ctrl.zoomEventTypes = [
        Cesium.CameraEventType.WHEEL,
        Cesium.CameraEventType.PINCH,
      ];
      ctrl.tiltEventTypes = [
        Cesium.CameraEventType.RIGHT_DRAG,
        Cesium.CameraEventType.PINCH,
        {
          eventType: Cesium.CameraEventType.LEFT_DRAG,
          modifier: Cesium.KeyboardEventModifier.CTRL,
        },
      ];

      // Track camera center for acre presets + HUD
      centerTimer = setInterval(() => {
        if (viewer.isDestroyed()) return;
        try {
          const carto = viewer.camera.positionCartographic;
          setCameraCenter({
            lat: Cesium.Math.toDegrees(carto.latitude),
            lng: Cesium.Math.toDegrees(carto.longitude),
            height: carto.height,
          });
        } catch {
          /* ignore */
        }
      }, 500);

      viewerRef.current = viewer;
      setMapReady(true);
    }

    init().catch((err) => console.error("Cesium init failed", err));

    return () => {
      destroyed = true;
      if (centerTimer) clearInterval(centerTimer);
      handlerRef.current?.destroy();
      handlerRef.current = null;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap / labels switch
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;
    applyBasemap(Cesium, viewer, basemap, layers.labels).catch(console.warn);
  }, [basemap, layers.labels]);

  // Draw / measure handlers
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    handlerRef.current?.destroy();
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = handler;

    // Crosshair cursor in draw/measure
    viewer.canvas.style.cursor =
      mode === "draw" || mode === "measure" ? "crosshair" : "default";

    const pickPosition = (pos: import("cesium").Cartesian2) => {
      let cartesian: import("cesium").Cartesian3 | undefined =
        viewer.scene.pickPosition(pos) ?? undefined;
      if (!cartesian) {
        const ray = viewer.camera.getPickRay(pos);
        if (ray) {
          const picked = viewer.scene.globe.pick(ray, viewer.scene);
          cartesian = picked ?? undefined;
        }
      }
      if (!cartesian) return null;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        longitude: Cesium.Math.toDegrees(carto.longitude),
        latitude: Cesium.Math.toDegrees(carto.latitude),
        height: carto.height,
      } as PolygonPoint;
    };

    if (mode === "draw") {
      handler.setInputAction(
        (click: { position: import("cesium").Cartesian2 }) => {
          const pt = pickPosition(click.position);
          if (!pt) return;

          const state = useStudioStore.getState();
          // Click near first point (when ≥3) closes polygon
          if (state.polygon.length >= 3 && !state.isPolygonClosed) {
            const first = state.polygon[0]!;
            const d = haversineDistanceMeters(
              { lat: first.latitude, lng: first.longitude },
              { lat: pt.latitude, lng: pt.longitude }
            );
            // ~3% of view height as close threshold, min 25m
            const h = state.cameraCenter.height;
            const threshold = Math.max(25, h * 0.02);
            if (d < threshold) {
              closePolygon();
              return;
            }
          }
          addPolygonPoint(pt);
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );

      handler.setInputAction(() => {
        closePolygon();
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    if (mode === "measure") {
      handler.setInputAction(
        (click: { position: import("cesium").Cartesian2 }) => {
          const pt = pickPosition(click.position);
          if (!pt) return;
          const current = useStudioStore.getState().measurePoints;
          if (current.length >= 2) {
            setMeasurePoints([pt]);
            useStudioStore.setState({ measureDistanceM: 0 });
          } else {
            addMeasurePoint(pt);
            if (current.length === 1) {
              const a = current[0]!;
              const dist = haversineDistanceMeters(
                { lat: a.latitude, lng: a.longitude },
                { lat: pt.latitude, lng: pt.longitude }
              );
              useStudioStore.setState({ measureDistanceM: dist });
            }
          }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
    }

    return () => {
      handler.destroy();
      if (handlerRef.current === handler) handlerRef.current = null;
      if (viewer && !viewer.isDestroyed()) {
        viewer.canvas.style.cursor = "default";
      }
    };
  }, [
    mode,
    addPolygonPoint,
    closePolygon,
    addMeasurePoint,
    setMeasurePoints,
  ]);

  // Polygon graphics — friendlier vertices + live area
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    pointEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    pointEntitiesRef.current = [];
    if (polygonEntityRef.current) {
      viewer.entities.remove(polygonEntityRef.current);
      polygonEntityRef.current = null;
    }

    if (!layers.polygon || polygon.length === 0) return;

    const area =
      polygon.length >= 3
        ? calculateAreaAcres(polygon)
        : 0;

    polygon.forEach((p, i) => {
      const isFirst = i === 0;
      const isLast = i === polygon.length - 1;
      const ent = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude),
        point: {
          pixelSize: isFirst ? 14 : 11,
          color: isFirst
            ? Cesium.Color.fromCssColorString("#34d399")
            : Cesium.Color.fromCssColorString("#38bdf8"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label:
          isFirst || (isLast && !isPolygonClosed)
            ? {
                text: isFirst
                  ? isPolygonClosed
                    ? "Parcel"
                    : polygon.length >= 3
                      ? "Click to close"
                      : "Start"
                  : `#${i + 1}`,
                font: "600 12px Inter, system-ui, sans-serif",
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 4,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              }
            : undefined,
      });
      pointEntitiesRef.current.push(ent);
    });

    if (polygon.length >= 2) {
      const positions = polygon.map((p) =>
        Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
      );
      if (isPolygonClosed || polygon.length >= 3) {
        // close ring visually when drawing preview with 3+
        if (isPolygonClosed) {
          positions.push(
            Cesium.Cartesian3.fromDegrees(
              polygon[0]!.longitude,
              polygon[0]!.latitude
            )
          );
        }
      }

      const closed = isPolygonClosed && polygon.length >= 3;
      const showFill = closed || (!isPolygonClosed && polygon.length >= 3);

      polygonEntityRef.current = viewer.entities.add({
        polyline: {
          positions: closed
            ? [
                ...polygon.map((p) =>
                  Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
                ),
                Cesium.Cartesian3.fromDegrees(
                  polygon[0]!.longitude,
                  polygon[0]!.latitude
                ),
              ]
            : positions,
          width: 4,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.fromCssColorString("#38bdf8"),
          }),
          clampToGround: true,
        },
        polygon: showFill
          ? {
              hierarchy: new Cesium.PolygonHierarchy(
                polygon.map((p) =>
                  Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
                )
              ),
              material: Cesium.Color.fromCssColorString("#38bdf8").withAlpha(
                closed ? 0.28 : 0.15
              ),
              outline: false,
              classificationType: Cesium.ClassificationType.BOTH,
            }
          : undefined,
        position:
          polygon.length >= 3
            ? (() => {
                const c = calculateCentroid(polygon);
                return c
                  ? Cesium.Cartesian3.fromDegrees(c.lng, c.lat)
                  : undefined;
              })()
            : undefined,
        label:
          polygon.length >= 3
            ? {
                text: `${area < 10 ? area.toFixed(2) : area.toFixed(1)} acres`,
                font: "700 14px Inter, system-ui, sans-serif",
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 4,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                showBackground: true,
                backgroundColor: Cesium.Color.fromCssColorString(
                  "#0c1222"
                ).withAlpha(0.75),
                backgroundPadding: new Cesium.Cartesian2(10, 6),
                pixelOffset: new Cesium.Cartesian2(0, -8),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              }
            : undefined,
      });
    }
  }, [polygon, isPolygonClosed, layers.polygon]);

  // Measurement
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    measureEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    measureEntitiesRef.current = [];

    measurePoints.forEach((p, i) => {
      measureEntitiesRef.current.push(
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude),
          point: {
            pixelSize: 10,
            color: Cesium.Color.fromCssColorString("#fbbf24"),
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
          label: {
            text: i === 0 ? "A" : "B",
            font: "12px Inter, sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 3,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        })
      );
    });

    if (measurePoints.length === 2) {
      const [a, b] = measurePoints;
      const dist = haversineDistanceMeters(
        { lat: a!.latitude, lng: a!.longitude },
        { lat: b!.latitude, lng: b!.longitude }
      );
      useStudioStore.setState({ measureDistanceM: dist });
      const midLng = (a!.longitude + b!.longitude) / 2;
      const midLat = (a!.latitude + b!.latitude) / 2;
      const label =
        dist < 1000
          ? `${Math.round(dist)} m`
          : `${(dist / 1000).toFixed(2)} km`;

      measureEntitiesRef.current.push(
        viewer.entities.add({
          polyline: {
            positions: [
              Cesium.Cartesian3.fromDegrees(a!.longitude, a!.latitude),
              Cesium.Cartesian3.fromDegrees(b!.longitude, b!.latitude),
            ],
            width: 3,
            material: Cesium.Color.fromCssColorString("#fbbf24"),
            clampToGround: true,
          },
        }),
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(midLng, midLat),
          label: {
            text: label,
            font: "700 14px Inter, sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 4,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: true,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.6),
            pixelOffset: new Cesium.Cartesian2(0, -16),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        })
      );
    }
  }, [measurePoints]);

  // Model placement
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    if (modelEntityRef.current) {
      viewer.entities.remove(modelEntityRef.current);
      modelEntityRef.current = null;
    }

    if (!modelUrl || !centroid || !layers.model) return;

    const { scale, heading, heightOffset } = modelTransform;
    const position = Cesium.Cartesian3.fromDegrees(
      centroid.lng,
      centroid.lat,
      heightOffset || 0
    );
    const hpr = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(heading),
      0,
      0
    );
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr
    );

    modelEntityRef.current = viewer.entities.add({
      name: "AI Development",
      position,
      orientation,
      model: {
        uri: modelUrl,
        scale,
        minimumPixelSize: 64,
        maximumScale: 20000,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        color: layers.wireframe
          ? Cesium.Color.CYAN.withAlpha(0.4)
          : Cesium.Color.WHITE,
        colorBlendMode: layers.wireframe
          ? Cesium.ColorBlendMode.MIX
          : Cesium.ColorBlendMode.HIGHLIGHT,
        colorBlendAmount: layers.wireframe ? 0.7 : 0,
        silhouetteColor: Cesium.Color.fromCssColorString("#38bdf8"),
        silhouetteSize: layers.wireframe ? 1.5 : 0,
        shadows: Cesium.ShadowMode.ENABLED,
      },
    });

    const isNew = lastModelUrl.current !== modelUrl;
    lastModelUrl.current = modelUrl;
    if (isNew) {
      const area = useStudioStore.getState().areaAcres;
      const range = Math.max(400, Math.sqrt(Math.max(area, 1) * 4047) * 2.5);
      viewer.flyTo(modelEntityRef.current, {
        duration: 2.2,
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(30),
          Cesium.Math.toRadians(-30),
          range
        ),
      });
    }
  }, [modelUrl, centroid, modelTransform, layers.model, layers.wireframe]);

  // Time of day
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;
    setTimeFromHours(Cesium, viewer.clock, timeOfDay);
    viewer.shadows = layers.shadows;
    viewer.terrainShadows = layers.shadows
      ? Cesium.ShadowMode.RECEIVE_ONLY
      : Cesium.ShadowMode.DISABLED;
  }, [timeOfDay, layers.shadows]);

  // Camera presets
  useEffect(() => {
    if (!pendingCameraPreset) return;
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) {
      clearCameraPreset();
      return;
    }

    const center = centroid ?? useStudioStore.getState().cameraCenter;
    const area = useStudioStore.getState().areaAcres || 25;
    const baseRange = Math.max(500, Math.sqrt(area * 4047) * 3);

    const fly = (
      heading: number,
      pitch: number,
      range: number,
      hour?: number
    ) => {
      const dest = Cesium.Cartesian3.fromDegrees(center.lng, center.lat, 0);
      viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(dest, range * 0.35),
        {
          duration: 1.8,
          offset: new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(heading),
            Cesium.Math.toRadians(pitch),
            range
          ),
        }
      );
      if (hour !== undefined) setTimeOfDay(hour);
    };

    switch (pendingCameraPreset) {
      case "birds-eye":
        fly(0, -85, baseRange * 1.8, 12);
        break;
      case "ground":
        fly(45, -12, baseRange * 0.35, 15);
        break;
      case "golden-hour":
        fly(250, -28, baseRange, 17.5);
        break;
      case "dramatic-sunset":
        fly(280, -18, baseRange * 1.2, 19);
        break;
    }
    clearCameraPreset();
  }, [pendingCameraPreset, centroid, clearCameraPreset, setTimeOfDay]);

  // Fly-to
  useEffect(() => {
    if (!flyToRequest) return;
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) {
      clearFlyTo();
      return;
    }
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyToRequest.lng,
        flyToRequest.lat,
        flyToRequest.height ?? 1800
      ),
      orientation: {
        heading: Cesium.Math.toRadians(flyToRequest.heading ?? 20),
        pitch: Cesium.Math.toRadians(flyToRequest.pitch ?? -40),
        roll: 0,
      },
      duration: 2.2,
    });
    clearFlyTo();
  }, [flyToRequest, clearFlyTo]);

  // Nav actions (zoom, home, north, selection)
  useEffect(() => {
    if (!navAction) return;
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) {
      clearNav();
      return;
    }

    if (navAction === "zoom-in") {
      viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.35);
    } else if (navAction === "zoom-out") {
      viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.45);
    } else if (navAction === "home") {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          DEFAULT_CAMERA.longitude,
          DEFAULT_CAMERA.latitude,
          DEFAULT_CAMERA.height
        ),
        orientation: {
          heading: Cesium.Math.toRadians(DEFAULT_CAMERA.heading),
          pitch: Cesium.Math.toRadians(DEFAULT_CAMERA.pitch),
          roll: 0,
        },
        duration: 1.8,
      });
    } else if (navAction === "north") {
      const c = viewer.camera.positionCartographic;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(
          c.longitude,
          c.latitude,
          c.height
        ),
        orientation: {
          heading: 0,
          pitch: viewer.camera.pitch,
          roll: 0,
        },
        duration: 0.8,
      });
    } else if (navAction === "selection") {
      const c =
        useStudioStore.getState().centroid ??
        useStudioStore.getState().cameraCenter;
      const area = useStudioStore.getState().areaAcres || 10;
      const range = Math.max(600, Math.sqrt(area * 4047) * 3);
      const dest = Cesium.Cartesian3.fromDegrees(c.lng, c.lat, 0);
      viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(dest, 80), {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(20),
          Cesium.Math.toRadians(-45),
          range
        ),
      });
    }
    clearNav();
  }, [navAction, clearNav]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
      onContextMenu={onContextMenu}
    />
  );
}
