"use client";
import { useEffect, useRef } from "react";
import {
  SciChartSurface,
  NumericAxis,
  FastRectangleRenderableSeries,
  EColumnMode,
  EColumnYMode,
  XyxyDataSeries,
  Thickness,
  EAxisAlignment,
  ETextAlignment,
  ETitlePosition,
  ENumericFormat,
  IPointMetadata,
  GenericAnimation,
  easing,
  EDataLabelSkipMode,
  EVerticalTextPosition,
  EHorizontalTextPosition,
  SciChartJSLightTheme,
  NumberRange,
  LabelProviderBase2D,
  SciChartDefaults,
  ELabelAlignment,
} from "scichart";

import { data } from "./atp-rankings";

// An example of WASM dependencies URLs configuration to fetch from origin server:
SciChartSurface.configure({
  wasmUrl: "scichart2d.wasm",
  // dataUrl: "scichart2d.data",
});

export const histogramElementId = "histogramElementId";

SciChartDefaults.useNativeText = false;

async function initSciChart(rootElement: string) {
  let element = 0;

  type NewMetadata = IPointMetadata & {
    rank: number;
    name: string;
    country: string;
    isSelected?: boolean;
  };

  type dataCType = {
    xValues: number[];
    yValues: number[];
    x1Values: number[];
    y1Values: number[];
    metadata: NewMetadata[];
    year: string;
    info: string;
  }[];

  const dataC: dataCType = [];

  // all data generation

  data.forEach((d, i) => {
    let newNextYearIndexes: number[] = [];
    let repeatedCurrYearIndexes: number[] = [];
    let repeatedNextYearIndexes: number[] = [];
    let removedNexYear: number[] = [];

    if (i < data.length - 1) {
      const currYearNames = new Set(data[i].top10.map((player) => player.name));
      const nextYearNames = new Set(
        data[i + 1].top10.map((player) => player.name)
      );

      const currYearMap: Record<string, { rank: number }> = {};

      data[i].top10.forEach((player) => {
        currYearMap[player.name] = { rank: player.rank };
      });

      newNextYearIndexes = data[i + 1].top10
        .filter((player) => !currYearNames.has(player.name))
        .map((player) => +player.rank - 1) as number[];

      repeatedCurrYearIndexes = data[i + 1].top10
        .filter((player) => currYearMap[player.name])
        .map((player) => currYearMap[player.name].rank - 1);

      repeatedNextYearIndexes = data[i + 1].top10
        .filter((player) => currYearNames.has(player.name))
        .map((player) => +player.rank - 1) as number[];

      removedNexYear = data[i].top10
        .filter((player) => !nextYearNames.has(player.name))
        .map((player) => player.rank - 1);
    }

    // console.log(
    //   "removedNexYear",
    //   removedNexYear,
    //   "repeatedCurrYearIndexes",
    //   repeatedCurrYearIndexes,
    //   "repeatedNextYearIndexes",
    //   repeatedNextYearIndexes,
    //   "newNextYearIndexes",
    //   newNextYearIndexes
    // );

    const dataInitial = d.top10.map((d, i) => {
      return {
        metadata: d,
        x: 0,
        y: 10 - (i + 1),
        x1: 10,
        y1: 10 - i,
      };
    });

    const xValues = dataInitial.map((d) => d.x);
    const yValues = dataInitial.map((d) => d.y);
    const x1Values = dataInitial.map((d) => d.x1);
    const y1Values = dataInitial.map((d) => d.y1);
    const metadata = dataInitial.map((d) => d.metadata) as NewMetadata[];

    dataC.push({
      xValues,
      yValues,
      x1Values,
      y1Values,
      metadata,
      year: d.year,
      info: "full data",
    });

    if (i < data.length - 1) {
      // remove not repeating
      const dataRemoved = d.top10.map((d, i) => {
        return {
          metadata: d,
          x: 0,
          y: 10 - (i + 1),
          x1: removedNexYear.includes(i) ? 0 : 10,
          y1: 10 - i,
        };
      });

      const xValuesR = dataRemoved.map((d) => d.x);
      const yValuesR = dataRemoved.map((d) => d.y);
      const x1ValuesR = dataRemoved.map((d) => d.x1);
      const y1ValuesR = dataRemoved.map((d) => d.y1);
      const metadataR = dataRemoved.map((d) => d.metadata) as NewMetadata[];

      dataC.push({
        xValues: xValuesR,
        yValues: yValuesR,
        x1Values: x1ValuesR,
        y1Values: y1ValuesR,
        metadata: metadataR,
        year: d.year,
        info: "remove not repeating next year",
      });

      // remove not repeating end

      // update remaining players positions

      const dataUpdatePosition = d.top10.map((d, i) => {
        return {
          metadata: d,
          x: 0,
          y: repeatedCurrYearIndexes.includes(i)
            ? 10 - repeatedNextYearIndexes[repeatedCurrYearIndexes.indexOf(i)]
            : 10 - (i + 1),
          x1: removedNexYear.includes(i) ? 0 : 10,
          y1: repeatedCurrYearIndexes.includes(i)
            ? 10 -
              repeatedNextYearIndexes[repeatedCurrYearIndexes.indexOf(i)] -
              1
            : 10 - i,
        };
      });

      const xValuesUpd = dataUpdatePosition.map((d) => d.x);
      const yValuesUpd = dataUpdatePosition.map((d) => d.y);
      const x1ValuesUpd = dataUpdatePosition.map((d) => d.x1);
      const y1ValuesUpd = dataUpdatePosition.map((d) => d.y1);
      const metadataUpd = dataUpdatePosition.map(
        (d) => d.metadata
      ) as NewMetadata[];

      dataC.push({
        xValues: xValuesUpd,
        yValues: yValuesUpd,
        x1Values: x1ValuesUpd,
        y1Values: y1ValuesUpd,
        metadata: metadataUpd,
        year: d.year,
        info: "update remaining players positions",
      });

      // update remaining players positions end

      // current year players for animation
      dataC.push({
        xValues,
        yValues,
        x1Values,
        y1Values,
        metadata,
        year: d.year,
        info: "full data again",
      });
      // current year players for animation end
      // add new next year players
      if (i < data.length - 1) {
        const dataNext = data[i + 1].top10.map((d, i) => {
          return {
            metadata: d,
            x: 0,
            y: 10 - (i + 1),
            x1: newNextYearIndexes.includes(i) ? 0 : 10,
            y1: 10 - i,
          };
        });

        const xValues = dataNext.map((d) => d.x);
        const yValues = dataNext.map((d) => d.y);
        const x1Values = dataNext.map((d) => d.x1);
        const y1Values = dataNext.map((d) => d.y1);
        const metadata = dataNext.map((d) => d.metadata) as NewMetadata[];

        dataC.push({
          xValues,
          yValues,
          x1Values,
          y1Values,
          metadata,
          year: data[i + 1].year,
          info: "data next",
        });
      }

      // add new next year players end
    }

    // if last
    if (i === data.length - 1) {
      dataC.push({
        xValues,
        yValues,
        x1Values,
        y1Values,
        metadata,
        year: d.year,
        info: "full data again",
      });
    }
  });

  // console.log(dataC);

  ////

  // const getData = () => {
  //   const dataTest = data[element].top10.map((d, i) => {
  //     return {
  //       metadata: d,
  //       x: 0,
  //       y: 10 - (i + 1),
  //       x1: 10,
  //       y1: 10 - i,
  //     };
  //   });
  //   const xValues = dataTest.map((d) => d.x);
  //   const yValues = dataTest.map((d) => d.y);
  //   const x1Values = dataTest.map((d) => d.x1);
  //   const y1Values = dataTest.map((d) => d.y1);
  //   const metadata = dataTest.map(
  //     (d) => d.metadata
  //   ) as unknown as IPointMetadata[];

  //   return {
  //     xValues,
  //     yValues,
  //     x1Values,
  //     y1Values,
  //     metadata,
  //   };
  // };

  const initialData = {
    xValues: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    yValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], //.reverse(),
    x1Values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    y1Values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], //.reverse(),
    metadata: data[0].top10.map((d) => {
      return { ...d, isSelected: false };
    }),
  };

  const interpolateNumber = (from: number, to: number, progress: number) => {
    if (progress < 0) return from;
    if (progress > 1) return to;
    return from + (to - from) * progress;
  };

  // async function drawDataPointAnimationsChart(divId: string) {
  const { sciChartSurface, wasmContext } = await SciChartSurface.create(
    rootElement,
    {
      theme: new SciChartJSLightTheme(),
    }
  );

  class CustomLabelProvider extends LabelProviderBase2D {
    type!: string;
    onBeginAxisDraw(): void {}

    get formatLabel() {
      return (dataValue: number) => {
        if (dataValue === 10) return "";
        return `${Math.abs(dataValue - 10).toString()}.`;
      };
    }
  }

  // Setup axes
  sciChartSurface.xAxes.add(
    new NumericAxis(wasmContext, {
      visibleRange: new NumberRange(0, 10),
      isVisible: false,
    })
  );

  sciChartSurface.yAxes.add(
    new NumericAxis(wasmContext, {
      labelProvider: new CustomLabelProvider(),
      // labelProvider: new TextLabelProvider({
      //   labels: ["10.", "9.", "8.", "7.", "6.", "5.", "4.", "3.", "2.", "1."],
      //   maxLength: 10,
      // }),
      visibleRange: new NumberRange(0, 10),
      labelFormat: ENumericFormat.Engineering,
      axisTitle: "Rank",
      axisAlignment: EAxisAlignment.Left,
      drawMajorBands: false,
      drawLabels: true,
      drawMinorGridLines: false,
      drawMajorGridLines: false,
      drawMinorTickLines: false,
      drawMajorTickLines: false,
      keepLabelsWithinAxis: false,
      labelStyle: {
        fontSize: 22,
        fontWeight: "bold",
        // fontStyle: "Italic",
        color: "#6c3",
        fontFamily: "Arial",
        alignment: ELabelAlignment.Right,
        padding: new Thickness(0, 5, 30, 0),
      },
    })
  );

  sciChartSurface.title = [
    `ATP Year-end Top 10 in ${data[element].year.toString()}`,
  ];

  const topMargin = 30;
  const rightMargin = 30;
  const bottomMargin = 30;
  const leftMargin = 30;

  sciChartSurface.padding = new Thickness(
    topMargin,
    rightMargin,
    bottomMargin,
    leftMargin
  );

  // setup data
  const dataSeries = new XyxyDataSeries(wasmContext, initialData);

  const rectangleSeries = new FastRectangleRenderableSeries(wasmContext, {
    dataSeries,
    columnXMode: EColumnMode.StartEnd,
    columnYMode: EColumnYMode.TopBottom,
    // dataPointWidth: 1,
    // dataPointWidthMode: EDataPointWidthMode.Range,
    stroke: "#F9F9F9", // #F9F9F9
    strokeThickness: 4,
    fill: "white",
    // customTextureOptions: new StickFigureTextureOptions({ stroke: "black" }),
    opacity: 1,
    // topCornerRadius: 10,
    // bottomCornerRadius: 10,
    dataLabels: {
      skipMode: EDataLabelSkipMode.SkipIfSame,
      verticalTextPosition: EVerticalTextPosition.Center,
      horizontalTextPosition: EHorizontalTextPosition.Center,
      style: {
        fontFamily: "Arial",
        fontSize: 14,
      },
      color: "#34495e",
      metaDataSelector: (md) => {
        const metadata = md as NewMetadata;
        // ${metadata.rank.toString()}.
        return `${metadata.name.toString()} (${metadata.country.toString()})`;
      },
    },
  });
  sciChartSurface.renderableSeries.add(rectangleSeries);
  // Setup animations
  const dataAnimation = new GenericAnimation({
    from: initialData,
    to: dataC[element],
    duration: 1000,
    ease: easing.inOutSine,
    onAnimate: (from, to, progress) => {
      const newXValues: number[] = [];
      const newYValues: number[] = [];
      const newX1Values: number[] = [];
      const newY1Values: number[] = [];

      sciChartSurface.title = [
        `ATP Year-end Top 10 in ${dataC[element].year.toString()}`,
      ];

      const { metadata } = dataC[element];

      if (
        element !== 0 &&
        (dataC[element].info === "data next" ||
          dataC[element].info === "full data")
      ) {
        return;
      }

      from.xValues.forEach((_value, index) => {
        newXValues.push(
          interpolateNumber(from.xValues[index], to.xValues[index], progress)
        );
        newYValues.push(
          interpolateNumber(from.yValues[index], to.yValues[index], progress)
        );
        newX1Values.push(
          interpolateNumber(from.x1Values[index], to.x1Values[index], progress)
        );
        newY1Values.push(
          interpolateNumber(from.y1Values[index], to.y1Values[index], progress)
        );
      });

      dataSeries.clear();
      dataSeries.appendRange(
        newXValues,
        newYValues,
        newX1Values,
        newY1Values,
        metadata
      );
    },
    onCompleted: () => {
      dataAnimation.from = dataAnimation.to;
      dataAnimation.to = dataC[element];

      if (
        dataC[element].info === "full data again" ||
        dataC[element].info === "data next"
      ) {
        dataAnimation.delay = 0;
      } else if (
        dataC[element].info === "update remaining players positions" ||
        dataC[element].info === "full data"
      ) {
        dataAnimation.delay = 1000;
      } else {
        dataAnimation.delay = 4000;
      }

      // console.log(dataC[element].year);
      // console.log(dataC.length, element);
      // console.log(dataC[element].info);
      if (element !== dataC.length - 1) {
        dataAnimation.reset();
      }
      element += 1;

      // console.log("Data Point Animation Completed");
    },
  });
  sciChartSurface.addAnimation(dataAnimation);

  sciChartSurface.titleStyle = {
    color: "#6c3",
    fontSize: 30,
    fontWeight: "bold",
    alignment: ETextAlignment.Center,
    position: ETitlePosition.Top,
    placeWithinChart: false,
    padding: Thickness.fromString("40 0 0 0"),
  };

  return { sciChartSurface };
}

export default function Home() {
  const rootElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initPromise = initSciChart(rootElementRef.current?.id || "");

    return () => {
      initPromise.then(({ sciChartSurface }) => sciChartSurface.delete());
    };
  }, []);

  return (
    <div className="">
      <div
        id="chart-root"
        ref={rootElementRef}
        style={{ width: 900, height: 600 }}
      ></div>
    </div>
  );
}
