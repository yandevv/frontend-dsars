<script setup lang="ts">
/** O relatório enquanto os números não foram apurados. */
const widths = ['84%', '62%', '48%', '34%', '22%']
</script>

<template>
  <div
    role="status"
    class="flex flex-col gap-6"
  >
    <div
      aria-hidden="true"
      class="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4"
    >
      <div
        v-for="block in 4"
        :key="block"
        class="flex flex-col gap-2.5 bg-surface px-[22px] py-5"
      >
        <span class="block h-[11px] w-[118px] bg-track-bar" />
        <span class="block h-10 w-[92px] bg-skeleton" />
        <span class="block h-3 w-[140px] bg-track-bar" />
      </div>
    </div>

    <div
      aria-hidden="true"
      class="grid gap-6 lg:grid-cols-2"
    >
      <div
        v-for="chart in 2"
        :key="chart"
        class="flex flex-col border border-line"
      >
        <div class="border-b border-line px-[22px] py-[18px]">
          <span class="block h-[18px] w-[210px] bg-skeleton" />
        </div>
        <div class="flex flex-col gap-4 px-[22px] pb-6 pt-5">
          <div
            v-for="width in widths"
            :key="width"
            class="flex flex-col gap-2"
          >
            <span class="block h-3 w-40 bg-track-bar" />
            <div class="h-3.5 bg-track-bar">
              <div
                class="h-3.5 bg-skeleton"
                :style="{ width }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="text-sm text-ink-muted">
      Apurando os números do período. A satisfação agregada entra por último.
    </p>
  </div>
</template>
