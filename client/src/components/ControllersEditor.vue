<template>
  <div>
    <select v-model="selectedControllers" multiple="true">
      <option
        v-for="controller in controllers"
        :value="controller.controllerId"
        :key="controller.controllerId"
      >
        {{ controller.name }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import { controllerModule } from "@/store/modules";
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { Controller } from "@/types";

@Component
export default class ControllersEditor extends Vue {
  @Prop() private value!: number[];

  get selectedControllers(): number[] {
    return this.value;
  }

  set selectedControllers(value: number[]) {
    this.setValue(value);
  }

  get controllers(): Controller[] {
    return controllerModule.controllers;
  }

  @Emit("input")
  setValue(value: number[]) {
    return value;
  }

  mounted() {
    if (controllerModule.controllers.length === 0) {
      controllerModule.loadControllers();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
