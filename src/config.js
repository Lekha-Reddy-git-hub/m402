import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Tempo Testnet (Moderato) — defined manually for maximum compatibility
// If viem/chains exports tempoModerato in your version, you can import it instead
export const tempoTestnet = {
  id: 42431,
  name: 'Tempo Testnet (Moderato)',
  nativeCurrency: { name: 'USD', symbol: 'USD', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.moderato.tempo.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Tempo Explorer', url: 'https://explore.tempo.xyz' },
  },
  testnet: true,
}

export const config = createConfig({
  chains: [tempoTestnet],
  connectors: [injected()], // MetaMask, Rabby, Coinbase Wallet, etc.
  multiInjectedProviderDiscovery: true,
  transports: {
    [tempoTestnet.id]: http(),
  },
})

// Contract addresses on Tempo Testnet
export const ALPHA_USD = '0x20c0000000000000000000000000000000000001'
export const BETA_USD = '0x20c0000000000000000000000000000000000002'
export const PATH_USD = '0x20c0000000000000000000000000000000000000'
export const FEE_MANAGER = '0xfeec000000000000000000000000000000000000'
export const EXPLORER_URL = 'https://scout.tempo.xyz'
export const RPC_URL = 'https://rpc.moderato.tempo.xyz'

// Demo receiver address (testnet only)
export const M402_DEMO_RECEIVER = '0x000000000000000000000000000000000000dEaD'

// TIP-20 ABI (ERC-20 compatible + Tempo extensions)
export const TIP20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transferWithMemo',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'memo', type: 'bytes32' },
    ],
    outputs: [],
  },
]
