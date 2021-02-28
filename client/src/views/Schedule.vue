<template>
  <div>
    <table style="border: 1">
      <thead>
        <tr>
          <th>Start</th>
          <th>End</th>
          <th>Interval</th>
          <th>Power On</th>
          <th>Controllers</th>
        </tr>
      </thead>
      <tbody>
        <schedule-table-row
          v-for="(schedule, scheuldeIndex) in schedules"
          :key="'schedule_' + scheuldeIndex"
          :schedule="schedule"
          @save="saveItem"
          @deleted="deletedItem"
        ></schedule-table-row>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { schedulerModule } from "@/store/modules";
import ScheduleTableRow, {
  UISchedule,
} from "@/components/ScheduleTableRow.vue";
import { Schedule } from "@/types";

@Component({
  components: { ScheduleTableRow },
})
export default class ScheduleView extends Vue {
  get schedules(): UISchedule[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data = schedulerModule.schedules;
    const result: UISchedule[] = [];
    if (data) {
      for (const item of data) {
        Vue.set(result, result.length, {
          start: item.start,
          end: item.end ? item.end : today.getTime() / 1000,
          endNull: !item.end,
          interval: item.interval,
          power: item.power,
          controllerIds: item.controllerIds.slice(),
          scheduleId: item.scheduleId,
        });
      }
    }
    result.push({
      start: today.getTime() / 1000,
      end: today.getTime() / 1000,
      endNull: true,
      interval: 1440,
      controllerIds: [],
      power: true,
      scheduleId: null,
    });
    return result;
  }

  saveItem(value: UISchedule) {
    const schedule: Schedule = {
      start: value.start,
      end: value.endNull ? null : value.end,
      interval: value.interval,
      power: value.power,
      controllerIds: value.controllerIds,
      scheduleId: value.scheduleId,
    };
    schedulerModule.save(schedule);
  }

  deletedItem(value: number) {
    schedulerModule.deleted(value);
  }

  mounted() {
    schedulerModule.loadSchedules();
  }
}
</script>
