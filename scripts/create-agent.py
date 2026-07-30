#!/usr/bin/env python3
"""PAI Agent-Kit Template Generator — One-Click Agent Scaffold"""

import argparse
import json
import os
import subprocess
import sys

TEMPLATES = {
    "pi-auth": {
        "description": "Pi Network Browser Auth Flow",
        "files": {
            "src/index.ts": """import { PaiSkill } from '@pai/atom'

interface AuthInput {
  username: string
  accessToken?: string
  sandbox?: boolean
}

interface AuthOutput {
  verified: boolean
  did?: string
  kycStatus?: string
}

export const skill: PaiSkill<AuthInput, AuthOutput> = {
  name: 'pi-auth',
  version: '1.0.0',
  description: 'Pi Network authentication via KYC',
  execute: async (input, ctx) => {
    const token = input.accessToken || ctx.pi?.authToken
    if (!token) throw new Error('No Pi auth token provided')
    const result = await ctx.pi.verifyKYC(input.username)
    return { verified: result === 'passed', kycStatus: result }
  },
  validate: (input): input is AuthInput => {
    return typeof input === 'object' && input !== null
  },
  metadata: {
    author: '{{author}}',
    license: 'PiOS',
    sandbox: 'js',
    permissions: ['pi:kyc:read']
  }
}
""",
            "pai.yaml": """name: {{name}}
version: 1.0.0
type: skill
runtime: js
permissions:
  - pi:kyc:read
sandbox: js
"""
        }
    },
    "pi-pay": {
        "description": "Pi Payment Integration",
        "files": {
            "src/index.ts": """import { PaiSkill } from '@pai/atom'

interface PayInput {
  amount: number
  memo: string
  recipient: string
  metadata?: Record<string, unknown>
}

interface PayOutput {
  success: boolean
  txid?: string
  status?: string
}

export const skill: PaiSkill<PayInput, PayOutput> = {
  name: 'pi-pay',
  version: '1.0.0',
  description: 'Pi Network payment processor',
  execute: async (input, ctx) => {
    const payment = await ctx.pi.createPayment(input.amount, input.memo)
    return { success: true, txid: payment.txid, status: payment.status }
  },
  validate: (input): input is PayInput => {
    return typeof input === 'object' && input !== null
  },
  metadata: { author: '{{author}}', license: 'PiOS', sandbox: 'js', permissions: ['pi:payment'] }
}
""",
            "pai.yaml": """name: {{name}}
version: 1.0.0
type: skill
runtime: js
permissions:
  - pi:payment
sandbox: js
"""
        }
    },
    "ppp-service": {
        "description": "PPP Protocol Agent Service",
        "files": {
            "src/index.ts": """import { PaiSkill } from '@pai/atom'

interface PPPInput {
  endpoint: string
  body: unknown
  ttl?: number
}

interface PPPOutput {
  status: number
  body: unknown
  receipt: {
    digest: string
    signature: string
    timestamp: string
  }
}

export const skill: PaiSkill<PPPInput, PPPOutput> = {
  name: 'ppp-service',
  version: '1.0.0',
  description: 'PPP protocol handler — .ppp messages',
  execute: async (input, ctx) => {
    const receipt = ctx.trustchain.createReceipt(input)
    return {
      status: 200,
      body: { message: `Handled at ${input.endpoint}`, data: input.body },
      receipt
    }
  },
  validate: (input): input is PPPInput => true,
  metadata: { author: '{{author}}', license: 'PiOS', sandbox: 'js', permissions: [] }
}
""",
            "pai.yaml": """name: {{name}}
version: 1.0.0
type: service
runtime: js
protocol: ppp
"""
        }
    }
}

def create_template(name: str, template: str, author: str = "pai-list"):
    if template not in TEMPLATES:
        print(f"❌ Template '{template}' not found. Available: {list(TEMPLATES.keys())}")
        sys.exit(1)
    
    tpl = TEMPLATES[template]
    base = os.path.join(os.getcwd(), name)
    
    for relpath, content in tpl["files"].items():
        full_path = os.path.join(base, relpath)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content.replace("{{name}}", name).replace("{{author}}", author))
    
    print(f"✅ Created {name}/ using {template} template")
    print(f"   Description: {tpl['description']}")
    print(f"\n   Next steps:")
    print(f"   cd {name}")
    print(f"   pai deploy")

def main():
    parser = argparse.ArgumentParser(description="PAI Agent-Kit Template Generator")
    parser.add_argument("name", help="Your agent name")
    parser.add_argument("--template", "-t", default="pi-auth", choices=list(TEMPLATES.keys()), help="Template to use")
    parser.add_argument("--author", "-a", default="pai-list", help="Author name")
    args = parser.parse_args()
    create_template(args.name, args.template, args.author)

if __name__ == "__main__":
    main()
