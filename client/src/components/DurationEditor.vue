<template>
  <div>
    <input type="number" v-model="count" />
    <select v-model="units">
      <option value="1">Minutes</option>
      <option value="60">Hours</option>
      <option value="1440">Days</option>
    </select>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";

@Component
export default class DurationEditor extends Vue {
  @Prop() private value!: number;

  @Watch("value")
  private onValueChanged(newValue: number, oldValue: number) {
    let units = 1;
    if (newValue % 60 === 0) {
      newValue /= 60;
      units *= 60;
      if (newValue % 24 === 0) {
        newValue /= 24;
        units *= 24;
      }
    }
    this.units = units;
  }

  private units = 1;
  get count() {
    return this.value / this.units;
  }

  set count(value: number) {
    this.setValue(value * this.units);
  }

  @Emit("input")
  setValue(value: number) {
    return value;
  }

  mounted() {
    this.onValueChanged(this.value, this.value);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
