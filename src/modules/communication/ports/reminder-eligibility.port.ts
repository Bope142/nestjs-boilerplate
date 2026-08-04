import { Injectable } from '@nestjs/common';

export const REMINDER_ELIGIBILITY_ADAPTERS = Symbol(
  'REMINDER_ELIGIBILITY_ADAPTERS',
);

export interface ReminderEligibilityAdapter {
  readonly resourceType: string;
  isEligible(
    resourceId: string,
  ): Promise<{ eligible: boolean; reason?: string; complete?: boolean }>;
}

@Injectable()
export class ReminderEligibilityRegistry {
  private readonly adapters = new Map<string, ReminderEligibilityAdapter>();

  register(adapter: ReminderEligibilityAdapter): void {
    this.adapters.set(adapter.resourceType, adapter);
  }

  async check(
    resourceType: string,
    resourceId: string,
  ): Promise<{ eligible: boolean; reason?: string; complete?: boolean }> {
    const adapter = this.adapters.get(resourceType);
    if (!adapter) {
      return { eligible: true };
    }
    return adapter.isEligible(resourceId);
  }
}
