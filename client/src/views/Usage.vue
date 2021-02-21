<template>
  <div>
    <label for="from_date">From</label
    ><input type="date" v-model="fromDate" id="from_date" />
    <label for="to_date">To</label
    ><input type="date" v-model="toDate" id="to_date" />
    <scatter-chart :chart-data="usageData" style="height: 800px">
    </scatter-chart>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import ScatterChart from "@/components/ScatterChart.vue";
import { usageModule } from "@/store/modules";
import { ChartDataSets, ChartColor, Scriptable } from "chart.js";

interface ChartMinMax extends Chart.ChartPoint {
  yMin: number;
  yMax: number;
}

interface ChartDataSetsErrorBar extends ChartDataSets {
  errorBarLineWidth?: number;
  errorBarColor?: ChartColor | ChartColor[] | Scriptable<ChartColor>;
  errorBarWhiskerLineWidth?: number;
  errorBarWhiskerColor?: ChartColor | ChartColor[] | Scriptable<ChartColor>;
}

const colours = ["red", "green", "blue", "black"];
function mATokW(value: number) {
  return (value * 240) / 1000000;
}

@Component({
  components: {
    ScatterChart,
  },
})
export default class Usage extends Vue {
  get fromDate() {
    return usageModule.from.toDateString();
  }

  set fromDate(value: string) {
    usageModule.setFrom(new Date(value));
  }

  get toDate() {
    return usageModule.to.toDateString();
  }

  set toDate(value: string) {
    usageModule.setTo(new Date(value));
  }

  get usageData(): Chart.ChartData {
    if (!usageModule.readings) {
      console.log("no data");
      return {};
    }
    const datasets: ChartDataSets[] = [];
    console.log(usageModule.readings);
    for (const controllerId in usageModule.readings) {
      console.log("adding controller", controllerId);
      const controller = usageModule.readings[controllerId];
      const dataSet: ChartDataSetsErrorBar = {};
      dataSet.label = controller.name;
      const data: ChartMinMax[] = [];
      for (const value of controller.values) {
        data.push({
          x: value.time * 1000,
          y: mATokW(value.avg),
          yMin: mATokW(value.min),
          yMax: mATokW(value.max),
        });
      }
      dataSet.data = data;
      dataSet.borderColor = colours[datasets.length % colours.length];
      dataSet.backgroundColor = colours[datasets.length % colours.length];
      dataSet.errorBarColor = colours[datasets.length % colours.length];
      dataSet.errorBarWhiskerColor = colours[datasets.length % colours.length];
      datasets.push(dataSet);
    }
    console.log(datasets);
    return {
      datasets,
    };
  }
}
</script>
