export const TOOLTIPS: Record<string, string> = {
  // Core Metrics
  totalOccupancyCost:
    "The all-in cost of occupying the space over the full lease term, including base rent, operating expenses, parking, and other fees.",
  effectiveRent:
    "Total occupancy cost divided by total square footage and lease years. Normalizes different lease structures for apples-to-apples comparison.",
  effectiveRentWithTI:
    "Effective rent including your out-of-pocket tenant improvement costs. Shows the true cost when buildout exceeds the landlord's TI allowance.",
  npv: "Net Present Value discounts all future costs to today's dollars using your specified discount rate. Lower NPV means lower real cost.",
  annualCashFlow:
    "Year-by-year breakdown of total occupancy costs, showing how expenses change over the lease term due to escalations.",
  paybackPeriod:
    "The number of months needed to recoup your out-of-pocket tenant improvement costs (buildout cost minus landlord TI allowance).",
  costPerEmployee:
    "Total annual occupancy cost divided by the number of employees in the space. Measures space efficiency and per-person cost.",
  rentAsPercentOfRevenue:
    "Annual occupancy cost as a percentage of your business revenue. A standard affordability benchmark — most businesses target under 10%.",
  freeRentSavings:
    "The dollar value of rent you avoid paying during the free rent period. Quantifies the landlord's concession.",

  // Input Fields
  rentableSF:
    "The total leased area you pay rent on. Includes your usable space plus a share of common areas (lobby, hallways, restrooms).",
  usableSF:
    "The actual space you can use for your business operations, excluding shared common areas.",
  loadFactor:
    "The ratio of rentable to usable square footage. A 15% load factor means you pay for 15% more space than you actually use.",
  baseRentY1:
    "The annual rent per square foot in the first year of the lease, before any escalations are applied.",
  escalationType:
    "How rent increases each year. Fixed % applies the same increase annually. CPI ties increases to the Consumer Price Index.",
  escalationPercent:
    "The percentage by which rent increases each year. For CPI-based leases, enter your assumed CPI rate.",
  freeRent:
    "Months at the start of the lease when you pay no rent. Abated means truly free. Deferred means the rent is added back at the end.",
  rentStructure:
    "Gross: landlord covers operating expenses. NNN: you pay base rent plus OpEx, taxes, and insurance separately. Modified Gross: a blend.",
  opExPerSF:
    "Annual operating expenses per square foot. Relevant for NNN and Modified Gross leases where you pay these costs separately.",
  opExEscalation:
    "The annual percentage increase in operating expenses. Typically tracks with inflation.",
  propertyTax:
    "Annual property tax per square foot, if billed separately from operating expenses.",
  tiAllowance:
    "Dollar amount the landlord contributes toward building out your space. Anything above this is your out-of-pocket cost.",
  estimatedBuildoutCost:
    "The total estimated cost to build out the space to your specifications, including construction, fixtures, and permits.",
  existingCondition:
    "Current state of the space. Shell requires full buildout. Second Gen has prior tenant improvements. Turnkey is move-in ready.",
  discountRate:
    "The rate used to calculate Net Present Value — typically your cost of borrowing or target investment return. Default is 8%.",
  annualRevenue:
    "Your business's annual revenue, used to calculate occupancy cost as a percentage of revenue.",
  expectedRevenueGrowth:
    "Your anticipated annual business growth rate, used to project future rent-to-revenue ratios.",
  parkingCost:
    "Total monthly parking costs for all spaces included in the lease.",
  otherMonthlyFees:
    "Any additional monthly costs such as telecom, signage, storage, or amenity fees.",
  leaseTermMonths: "The total length of the lease in months.",
  leaseCommencementDate: "The date when the lease officially begins.",
  cpiAssumedPercent:
    "Your assumed Consumer Price Index rate for projecting CPI-based rent escalations.",

  // Lease Types
  nnn: "Triple Net lease: you pay base rent plus property taxes, insurance, and maintenance separately. Total cost is less predictable.",
  gross:
    "Full-Service Gross lease: the landlord covers operating expenses. You pay one all-inclusive rent amount.",
  modifiedGross:
    "Modified Gross lease: a hybrid where some operating expenses are included and others are passed through.",

  // Comparison
  bestValue:
    "The option with the lowest Net Present Value of total costs, representing the best financial value over the lease term.",
  discountingMode:
    "Monthly discounting is more precise (reflects actual payment timing). Annual is simpler and more common in CRE practice.",
};
