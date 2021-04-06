<template>
  <tr>
    <td>
      <input
        type="datetime-local"
        :value="getDateTimeLocalString(start)"
        @input="start = parseISOLocal($event.target.value)"
      />
    </td>
    <td>
      <input type="checkbox" v-model="endNull" />
      <input
        type="datetime-local"
        :value="getDateTimeLocalString(end)"
        @input="end = parseISOLocal($event.target.value)"
        :disabled="endNull"
      />
    </td>
    <td><duration-editor v-model="interval"></duration-editor></td>
    <td><input type="checkbox" v-model="power" /></td>
    <td><controllers-editor v-model="controllerIds"></controllers-editor></td>
    <td>
      <button @click="save">{{ scheduleId !== null ? "Save" : "Add" }}</button>
      <button v-if="scheduleId !== null" @click="deleted">Delete</button>
    </td>
  </tr>
</template>

<script lang="ts">
import { Schedule } from "@/types";
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import DurationEditor from "./DurationEditor.vue";
import ControllersEditor from "./ControllersEditor.vue";

export interface UISchedule {
  scheduleId: number | null;
  start: number;
  end: number;
  endNull: boolean;
  interval: number;
  power: boolean;
  controllerIds: number[];
}

@Component({ components: { DurationEditor, ControllersEditor } })
export default class ScheduleTableRow extends Vue {
  @Prop() private schedule!: UISchedule;

  @Watch("schedule")
  private onScheduleChanged(newValue: UISchedule, oldValue: UISchedule) {
    this.start = newValue.start;
    this.end = newValue.end;
    this.endNull = newValue.endNull;
    this.interval = newValue.interval;
    this.power = newValue.power;
    this.controllerIds = newValue.controllerIds;
    this.scheduleId = newValue.scheduleId;
  }
  private start = 0;
  private end = 0;
  private endNull = true;
  private interval = 0;
  private power = true;
  private controllerIds: number[] = [];
  private scheduleId: number | null = null;
  
  parseISOLocal(iso: string) {
    const b = iso.split(/\D/);
    return new Date(parseInt(b[0]), parseInt(b[1])-1, parseInt(b[2]), parseInt(b[3]), parseInt(b[4])).getTime() / 1000;
  }

  getDateTimeLocalString(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear().toString().padStart(4,'0')}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}T${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}`
  }

  mounted() {
    this.onScheduleChanged(this.schedule, this.schedule);
  }

  @Emit("save")
  save() {
    const value: UISchedule = {
      start: this.start,
      end: this.end,
      endNull: this.endNull,
      interval: this.interval,
      power: this.power,
      controllerIds: this.controllerIds,
      scheduleId: this.scheduleId,
    };
    return value;
  }

  @Emit("deleted")
  deleted() {
    return this.schedule.scheduleId;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
