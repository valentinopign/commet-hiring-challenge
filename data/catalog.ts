import type { Catalog } from "@/lib/catalog";

export const catalog = {
  organization: {
    id: "org_9fhq2p",
    name: "Nimbus",
    description: "AI image, copy and video generation for marketing teams.",
    currency: "USD"
  },
  features: [
    {
      code: "ai_generation",
      name: "AI generations",
      type: "credit",
      unit: "generation"
    },
    {
      code: "api_calls",
      name: "API calls",
      type: "credit",
      unit: "call"
    },
    {
      code: "video_render",
      name: "Video renders",
      type: "credit",
      unit: "render"
    },
    {
      code: "storage_gb",
      name: "Asset storage",
      type: "capacity",
      unit: "GB"
    },
    {
      code: "workspaces",
      name: "Workspaces",
      type: "capacity",
      unit: "workspace"
    },
    {
      code: "seats",
      name: "Team seats",
      type: "capacity",
      unit: "seat"
    },
    {
      code: "sso",
      name: "SAML SSO",
      type: "boolean"
    },
    {
      code: "audit_log",
      name: "Audit log",
      type: "boolean"
    },
    {
      code: "priority_support",
      name: "Priority support",
      type: "boolean"
    },
    {
      code: "custom_models",
      name: "Custom models",
      type: "boolean"
    },
    {
      code: "webhooks",
      name: "Webhooks",
      type: "boolean"
    },
    {
      code: "data_export",
      name: "Data export",
      type: "boolean"
    }
  ],
  plans: [
    {
      id: "plan_1fa03x",
      code: "free",
      name: "Free",
      description: "Try the product.",
      isPublic: true,
      isDefault: true,
      pricing: {
        type: "free",
        includedCredits: 500
      },
      exhaustionPolicy: {
        type: "block"
      },
      currentReleaseVersion: 1,
      releases: [
        {
          version: 1,
          status: "published",
          publishedAt: "2026-01-15T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 6
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 5,
                overage: {
                  type: "blocked"
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 2,
                overage: {
                  type: "blocked"
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 1,
                overage: {
                  type: "blocked"
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: false
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: false
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: false
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: false
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: false
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: false
            }
          ]
        }
      ]
    },
    {
      id: "plan_5kq72d",
      code: "starter",
      name: "Starter",
      description: "For small teams getting started.",
      isPublic: true,
      isDefault: false,
      pricing: {
        type: "standard",
        prices: [
          {
            id: "prc_3nm88t",
            billingInterval: "monthly",
            price: 2900,
            includedCredits: 3500,
            isDefault: true
          },
          {
            id: "prc_9pz21c",
            billingInterval: "yearly",
            price: 29000,
            includedCredits: 42000,
            isDefault: false
          }
        ]
      },
      exhaustionPolicy: {
        type: "bill_overage",
        pricePer1000Credits: 1200
      },
      currentReleaseVersion: 2,
      releases: [
        {
          version: 1,
          status: "retired",
          publishedAt: "2026-02-02T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 6
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 25,
                overage: {
                  type: "billed",
                  unitPrice: 15
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 3,
                overage: {
                  type: "billed",
                  unitPrice: 1500
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 2,
                overage: {
                  type: "billed",
                  unitPrice: 500
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: false
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: false
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: false
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: false
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: false
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: false
            }
          ]
        },
        {
          version: 2,
          status: "published",
          publishedAt: "2026-06-18T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 6
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "video_render",
              type: "credit",
              creditsPerUnit: 40
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 50,
                overage: {
                  type: "billed",
                  unitPrice: 15
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 3,
                overage: {
                  type: "billed",
                  unitPrice: 1500
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 3,
                overage: {
                  type: "billed",
                  unitPrice: 500
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: false
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: false
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: false
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: false
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: true
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: false
            }
          ]
        }
      ]
    },
    {
      id: "plan_3kd82m",
      code: "growth",
      name: "Growth",
      description: "For teams shipping AI features in production.",
      isPublic: true,
      isDefault: false,
      pricing: {
        type: "standard",
        prices: [
          {
            id: "prc_7m2k9d",
            billingInterval: "monthly",
            price: 9900,
            includedCredits: 12500,
            isDefault: true
          },
          {
            id: "prc_4x8w1a",
            billingInterval: "yearly",
            price: 99000,
            includedCredits: 150000,
            isDefault: false
          }
        ]
      },
      exhaustionPolicy: {
        type: "bill_overage",
        pricePer1000Credits: 1000
      },
      currentReleaseVersion: 3,
      releases: [
        {
          version: 1,
          status: "retired",
          publishedAt: "2026-02-02T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 6
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 100,
                overage: {
                  type: "billed",
                  unitPrice: 12
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 5,
                overage: {
                  type: "billed",
                  unitPrice: 1500
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 5,
                overage: {
                  type: "billed",
                  unitPrice: 500
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: false
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: false
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: true
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: false
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: true
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: false
            }
          ]
        },
        {
          version: 2,
          status: "retired",
          publishedAt: "2026-04-21T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 6
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "video_render",
              type: "credit",
              creditsPerUnit: 30
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 250,
                overage: {
                  type: "billed",
                  unitPrice: 12
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 5,
                overage: {
                  type: "billed",
                  unitPrice: 1500
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 10,
                overage: {
                  type: "billed",
                  unitPrice: 500
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: false
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: true
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: true
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: false
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: true
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: false
            }
          ]
        },
        {
          version: 3,
          status: "published",
          publishedAt: "2026-08-14T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 5
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "video_render",
              type: "credit",
              creditsPerUnit: 30
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 250,
                overage: {
                  type: "billed",
                  unitPrice: 12
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 5,
                overage: {
                  type: "billed",
                  unitPrice: 1500
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 10,
                overage: {
                  type: "billed",
                  unitPrice: 500
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: true
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: true
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: true
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: false
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: true
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: true
            }
          ]
        }
      ]
    },
    {
      id: "plan_6bw40s",
      code: "scale",
      name: "Scale",
      description: "High volume, predictable spend.",
      isPublic: true,
      isDefault: false,
      pricing: {
        type: "standard",
        prices: [
          {
            id: "prc_5tq60n",
            billingInterval: "monthly",
            price: 29900,
            includedCredits: 40000,
            isDefault: true
          },
          {
            id: "prc_2ce74j",
            billingInterval: "yearly",
            price: 299000,
            includedCredits: 480000,
            isDefault: false
          }
        ]
      },
      exhaustionPolicy: {
        type: "bill_overage",
        pricePer1000Credits: 900
      },
      currentReleaseVersion: 2,
      releases: [
        {
          version: 1,
          status: "retired",
          publishedAt: "2026-03-10T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 5
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "video_render",
              type: "credit",
              creditsPerUnit: 30
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 500,
                overage: {
                  type: "billed",
                  unitPrice: 10
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 10,
                overage: {
                  type: "billed",
                  unitPrice: 1300
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 25,
                overage: {
                  type: "billed",
                  unitPrice: 400
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: true
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: true
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: true
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: false
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: true
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: true
            }
          ]
        },
        {
          version: 2,
          status: "published",
          publishedAt: "2026-07-30T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 4
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "video_render",
              type: "credit",
              creditsPerUnit: 25
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 1000,
                overage: {
                  type: "billed",
                  unitPrice: 10
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 15,
                overage: {
                  type: "billed",
                  unitPrice: 1200
                }
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 50,
                overage: {
                  type: "billed",
                  unitPrice: 400
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: true
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: true
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: true
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: true
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: true
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: true
            }
          ]
        }
      ]
    },
    {
      id: "plan_7yv18h",
      code: "enterprise",
      name: "Enterprise",
      description: "Negotiated contracts.",
      isPublic: false,
      isDefault: false,
      pricing: {
        type: "standard",
        prices: [
          {
            id: "prc_8ur52g",
            billingInterval: "monthly",
            price: 199900,
            includedCredits: 300000,
            isDefault: true
          },
          {
            id: "prc_1kd37y",
            billingInterval: "yearly",
            price: 1999000,
            includedCredits: 3600000,
            isDefault: false
          }
        ]
      },
      exhaustionPolicy: {
        type: "bill_overage",
        pricePer1000Credits: 800
      },
      currentReleaseVersion: 1,
      releases: [
        {
          version: 1,
          status: "published",
          publishedAt: "2026-05-04T00:00:00Z",
          features: [
            {
              code: "ai_generation",
              type: "credit",
              creditsPerUnit: 4
            },
            {
              code: "api_calls",
              type: "credit",
              creditsPerUnit: 1
            },
            {
              code: "video_render",
              type: "credit",
              creditsPerUnit: 20
            },
            {
              code: "storage_gb",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 5000,
                overage: {
                  type: "billed",
                  unitPrice: 8
                }
              }
            },
            {
              code: "seats",
              type: "capacity",
              limit: {
                type: "unlimited"
              }
            },
            {
              code: "workspaces",
              type: "capacity",
              limit: {
                type: "limited",
                includedAmount: 200,
                overage: {
                  type: "billed",
                  unitPrice: 300
                }
              }
            },
            {
              code: "sso",
              type: "boolean",
              enabled: true
            },
            {
              code: "audit_log",
              type: "boolean",
              enabled: true
            },
            {
              code: "priority_support",
              type: "boolean",
              enabled: true
            },
            {
              code: "custom_models",
              type: "boolean",
              enabled: true
            },
            {
              code: "webhooks",
              type: "boolean",
              enabled: true
            },
            {
              code: "data_export",
              type: "boolean",
              enabled: true
            }
          ]
        }
      ]
    }
  ],
  creditPacks: [
    {
      id: "cpk_1qd7se",
      code: "pack_10k",
      name: "10k credits",
      credits: 10000,
      price: 8800,
      expiresAfterDays: 90,
      planCodes: [
        "starter",
        "growth",
        "scale"
      ]
    },
    {
      id: "cpk_5gh92w",
      code: "pack_50k",
      name: "50k credits",
      credits: 50000,
      price: 42000,
      expiresAfterDays: 90,
      planCodes: [
        "growth",
        "scale"
      ]
    },
    {
      id: "cpk_8kl03r",
      code: "pack_250k",
      name: "250k credits",
      credits: 250000,
      price: 195000,
      expiresAfterDays: 180,
      planCodes: [
        "scale",
        "enterprise"
      ]
    }
  ],
  subscriptionsByRelease: [
    {
      planCode: "free",
      version: 1,
      subscriptions: 1240
    },
    {
      planCode: "starter",
      version: 1,
      subscriptions: 86
    },
    {
      planCode: "starter",
      version: 2,
      subscriptions: 502
    },
    {
      planCode: "growth",
      version: 1,
      subscriptions: 12
    },
    {
      planCode: "growth",
      version: 2,
      subscriptions: 340
    },
    {
      planCode: "growth",
      version: 3,
      subscriptions: 46
    },
    {
      planCode: "scale",
      version: 1,
      subscriptions: 18
    },
    {
      planCode: "scale",
      version: 2,
      subscriptions: 94
    },
    {
      planCode: "enterprise",
      version: 1,
      subscriptions: 7
    }
  ]
} satisfies Catalog;
