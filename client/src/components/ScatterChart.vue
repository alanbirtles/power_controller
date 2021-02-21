<script lang="ts">
import {
  Component,
  Prop,
  Vue,
  Watch,
  Mixins,
  Emit,
} from "vue-property-decorator";
import Chart from "chart.js";
import VueChart from "vue-chartjs";
import { BaseChart } from "vue-chartjs/types/components";
import { ScatterithErrorBars } from "chartjs-chart-error-bars";

const ErrorScatter: typeof BaseChart = VueChart.generateChart(
  "scatter-with-error-bars-chart",
  "scatterWithErrorBars"
);

@Component
export default class ScatterChart extends Mixins(
  ErrorScatter,
  VueChart.mixins.reactiveProp
) {
  @Prop({ required: true, default: {} })
  public chartData!: Chart.ChartData;

  @Prop()
  public chartOptions!: Chart.ChartOptions;

  private options: Chart.ChartOptions = {};

  private chart!: Chart;

  mounted() {
    Chart.plugins.register(ScatterithErrorBars);
    this.addPlugin(ScatterithErrorBars);
    if (!this.chartOptions) {
      this.applyDefaultOptions();
    }
    // Draw chart
    this.renderChart(this.chartData, this.options);
    this.chart = this.$data._chart;
  }

  private applyDefaultOptions() {
    this.options.maintainAspectRatio = false;
    this.options.scales = {
      xAxes: [
        {
          type: "time",
          time: {
            unit: "minute",
          },
        },
      ],
      yAxes: [],
    };
    this.options.elements = {
      line: {
        tension: 0,
      },
    };
  }
}
</script>

<style>
</style>
