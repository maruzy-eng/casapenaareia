export type PricingRule = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  adjustment_type: string;
  adjustment_value: number | string;
  starts_at: string;
  ends_at: string;
  weekdays: number[] | null;
  minimum_nights: number | null;
  priority: number;
  applies_to_all_units: boolean;
  pricing_rule_units?:
    | {
        unit_id: string;
      }[]
    | null;
};

export type PricingNight = {
  date: string;
  basePrice: number;
  finalPrice: number;
  appliedRules: {
    id: string;
    name: string;
    type: string;
    adjustment_type: string;
    adjustment_value: number;
    priority: number;
  }[];
};

export type UpgradePricingType =
  | "per_night"
  | "per_stay"
  | "per_guest_per_night"
  | "per_guest_per_stay";

export type ReservationUpgradeInput = {
  id: string;
  name: string;
  price: number | string;
  pricing_type: UpgradePricingType;
};

export type ReservationUpgradeBreakdown = {
  id: string;
  name: string;
  pricing_type: UpgradePricingType;
  unit_price: number;
  quantity: number;
  total: number;
};

export type PricingResult = {
  unitId: string;
  checkIn: string;
  checkOut: string;
  basePrice: number;
  nights: number;
  subtotal: number;
  lodgingSubtotal: number;
  upgradesSubtotal: number;
  total: number;
  minimumNights: number | null;
  minimumNightsRuleName: string | null;
  nightsBreakdown: PricingNight[];
  appliedRulesSummary: {
    id: string;
    name: string;
    type: string;
    adjustment_type: string;
    adjustment_value: number;
    priority: number;
  }[];
  upgradesBreakdown: ReservationUpgradeBreakdown[];
};

export type LegacyBookingPriceResult = {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  total: number;
};

type CalculateReservationPricingInput = {
  unitId: string;
  basePrice: number | string | null | undefined;
  checkIn: string;
  checkOut: string;
  rules: PricingRule[];
  selectedUpgradeIds?: string[];
  guestsCount?: number;
  upgrades?: ReservationUpgradeInput[];
};

function parseDateUTC(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");

  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day))
  );
}

function formatDateUTC(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysUTC(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

function diffDaysUTC(start: Date, end: Date) {
  const oneDay = 1000 * 60 * 60 * 24;

  return Math.round((end.getTime() - start.getTime()) / oneDay);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateUpgradeQuantity({
  pricingType,
  nights,
  guestsCount,
}: {
  pricingType: UpgradePricingType;
  nights: number;
  guestsCount: number;
}) {
  if (pricingType === "per_night") return nights;
  if (pricingType === "per_guest_per_night") return guestsCount * nights;
  if (pricingType === "per_guest_per_stay") return guestsCount;

  return 1;
}

function calculateUpgradesBreakdown({
  upgrades,
  selectedUpgradeIds,
  nights,
  guestsCount,
}: {
  upgrades: ReservationUpgradeInput[];
  selectedUpgradeIds: string[];
  nights: number;
  guestsCount: number;
}) {
  const selectedSet = new Set(selectedUpgradeIds);

  return upgrades
    .filter((upgrade) => selectedSet.has(upgrade.id))
    .map((upgrade) => {
      const unitPrice = roundMoney(Number(upgrade.price || 0));
      const quantity = calculateUpgradeQuantity({
        pricingType: upgrade.pricing_type,
        nights,
        guestsCount,
      });

      return {
        id: upgrade.id,
        name: upgrade.name,
        pricing_type: upgrade.pricing_type,
        unit_price: unitPrice,
        quantity,
        total: roundMoney(unitPrice * quantity),
      };
    });
}

function isRuleForUnit(rule: PricingRule, unitId: string) {
  if (rule.applies_to_all_units) return true;

  const linkedUnits = rule.pricing_rule_units || [];

  return linkedUnits.some((item) => item.unit_id === unitId);
}

function isRuleForDate(rule: PricingRule, date: Date) {
  const dateString = formatDateUTC(date);
  const startsAt = rule.starts_at.slice(0, 10);
  const endsAt = rule.ends_at.slice(0, 10);

  if (dateString < startsAt || dateString > endsAt) {
    return false;
  }

  if (Array.isArray(rule.weekdays) && rule.weekdays.length > 0) {
    const weekday = date.getUTCDay();

    return rule.weekdays.includes(weekday);
  }

  return true;
}

function normalizeRule(rule: PricingRule) {
  return {
    id: rule.id,
    name: rule.name,
    type: rule.type,
    adjustment_type: rule.adjustment_type,
    adjustment_value: Number(rule.adjustment_value || 0),
    priority: Number(rule.priority || 1),
  };
}

function applyNonFixedRule(price: number, rule: PricingRule) {
  const value = Number(rule.adjustment_value || 0);

  if (rule.adjustment_type === "percentage_increase") {
    return price + price * (value / 100);
  }

  if (rule.adjustment_type === "percentage_decrease") {
    return price - price * (value / 100);
  }

  if (rule.adjustment_type === "fixed_increase") {
    return price + value;
  }

  if (rule.adjustment_type === "fixed_decrease") {
    return price - value;
  }

  return price;
}

export function calculateReservationPricing({
  unitId,
  basePrice,
  checkIn,
  checkOut,
  rules,
  selectedUpgradeIds = [],
  guestsCount = 1,
  upgrades = [],
}: CalculateReservationPricingInput): PricingResult {
  const normalizedBasePrice = Number(basePrice || 0);
  const normalizedGuestsCount = Math.max(1, Number(guestsCount || 1));

  if (!unitId) {
    throw new Error("Acomodação inválida.");
  }

  if (normalizedBasePrice <= 0) {
    throw new Error("A acomodação selecionada não possui preço base.");
  }

  if (!checkIn || !checkOut) {
    throw new Error("Informe check-in e check-out.");
  }

  const checkInDate = parseDateUTC(checkIn);
  const checkOutDate = parseDateUTC(checkOut);

  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime())
  ) {
    throw new Error("Datas inválidas.");
  }

  const nights = diffDaysUTC(checkInDate, checkOutDate);

  if (nights <= 0) {
    throw new Error("O check-out precisa ser depois do check-in.");
  }

  const applicableRules = rules.filter((rule) =>
    isRuleForUnit(rule, unitId)
  );

  const minimumNightsRules = applicableRules
    .filter((rule) => Number(rule.minimum_nights || 0) > 0)
    .filter((rule) => {
      let cursor = checkInDate;

      while (cursor < checkOutDate) {
        if (isRuleForDate(rule, cursor)) {
          return true;
        }

        cursor = addDaysUTC(cursor, 1);
      }

      return false;
    })
    .sort(
      (first, second) =>
        Number(second.priority || 1) - Number(first.priority || 1)
    );

  const strongestMinimumRule = minimumNightsRules[0] || null;

  const minimumNights = strongestMinimumRule?.minimum_nights || null;

  if (minimumNights && nights < minimumNights) {
    throw new Error(
      `Essa regra exige estadia mínima de ${minimumNights} noite(s).`
    );
  }

  const nightsBreakdown: PricingNight[] = [];

  for (let index = 0; index < nights; index++) {
    const currentDate = addDaysUTC(checkInDate, index);
    const currentDateString = formatDateUTC(currentDate);

    const matchingRules = applicableRules
      .filter((rule) => isRuleForDate(rule, currentDate))
      .sort(
        (first, second) =>
          Number(second.priority || 1) - Number(first.priority || 1)
      );

    const fixedPriceRules = matchingRules.filter(
      (rule) => rule.adjustment_type === "fixed_price"
    );

    let finalPrice = normalizedBasePrice;
    let appliedRules: PricingNight["appliedRules"] = [];

    if (fixedPriceRules.length > 0) {
      const strongestFixedRule = fixedPriceRules[0];

      finalPrice = Number(strongestFixedRule.adjustment_value || 0);
      appliedRules = [normalizeRule(strongestFixedRule)];
    } else {
      for (const rule of matchingRules) {
        finalPrice = applyNonFixedRule(finalPrice, rule);
        appliedRules.push(normalizeRule(rule));
      }
    }

    nightsBreakdown.push({
      date: currentDateString,
      basePrice: roundMoney(normalizedBasePrice),
      finalPrice: roundMoney(Math.max(finalPrice, 0)),
      appliedRules,
    });
  }

  const lodgingSubtotal = nightsBreakdown.reduce(
    (sum, night) => sum + night.finalPrice,
    0
  );

  const upgradesBreakdown = calculateUpgradesBreakdown({
    upgrades,
    selectedUpgradeIds,
    nights,
    guestsCount: normalizedGuestsCount,
  });

  const upgradesSubtotal = upgradesBreakdown.reduce(
    (sum, upgrade) => sum + upgrade.total,
    0
  );

  const appliedRulesMap = new Map<
    string,
    PricingResult["appliedRulesSummary"][number]
  >();

  nightsBreakdown.forEach((night) => {
    night.appliedRules.forEach((rule) => {
      appliedRulesMap.set(rule.id, rule);
    });
  });

  const roundedLodgingSubtotal = roundMoney(lodgingSubtotal);
  const roundedUpgradesSubtotal = roundMoney(upgradesSubtotal);

  return {
    unitId,
    checkIn,
    checkOut,
    basePrice: roundMoney(normalizedBasePrice),
    nights,
    subtotal: roundedLodgingSubtotal,
    lodgingSubtotal: roundedLodgingSubtotal,
    upgradesSubtotal: roundedUpgradesSubtotal,
    total: roundMoney(roundedLodgingSubtotal + roundedUpgradesSubtotal),
    minimumNights,
    minimumNightsRuleName: strongestMinimumRule?.name || null,
    nightsBreakdown,
    appliedRulesSummary: Array.from(appliedRulesMap.values()).sort(
      (first, second) => second.priority - first.priority
    ),
    upgradesBreakdown,
  };
}

export function calculateBookingPrice({
  checkIn,
  checkOut,
  basePrice,
  cleaningFee = 0,
}: {
  checkIn: string;
  checkOut: string;
  basePrice: number | string | null | undefined;
  cleaningFee?: number | string | null | undefined;
}): LegacyBookingPriceResult {
  const pricing = calculateReservationPricing({
    unitId: "legacy-booking-price",
    basePrice,
    checkIn,
    checkOut,
    rules: [],
  });

  const normalizedCleaningFee = Number(cleaningFee || 0);
  const total = roundMoney(pricing.total + normalizedCleaningFee);

  return {
    nights: pricing.nights,
    nightlyRate: pricing.basePrice,
    subtotal: pricing.subtotal,
    cleaningFee: roundMoney(normalizedCleaningFee),
    total,
  };
}
