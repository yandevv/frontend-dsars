<script setup lang="ts">
import LandingHeader from "@/features/landing/components/LandingHeader.vue";
import LandingHero from "@/features/landing/components/LandingHero.vue";
import ResponseDeadlines from "@/features/landing/components/ResponseDeadlines.vue";
import DataSubjectRights from "@/features/landing/components/DataSubjectRights.vue";
import RequestFlowSteps from "@/features/landing/components/RequestFlowSteps.vue";
import LandingFooter from "@/features/landing/components/LandingFooter.vue";
import { useTenant } from "@/features/tenant/composables/useTenant";

const { tenant } = useTenant();
</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl flex-col">
    <LandingHeader :tenant="tenant" />

    <main
      id="conteudo-principal"
      tabindex="-1"
    >
      <LandingHero :tenant="tenant" />
      <ResponseDeadlines />
      <DataSubjectRights :show-legal-reference="tenant.showLegalReferences" />
      <RequestFlowSteps />
    </main>

    <LandingFooter :tenant="tenant" />
  </div>
</template>
