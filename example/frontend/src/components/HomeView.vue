<template>
  <div class="home">
    <el-select v-model="state.tokenAddress" placeholder="Select" size="large">
      <el-option
        v-for="item in state.tokens"
        :key="item.address"
        :label="item.name"
        :value="item.address"
      />
    </el-select>
    <el-select v-model="state.fromChainId" placeholder="Select" size="large">
      <el-option
        v-for="item in state.fromChains"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      />
    </el-select>
    <el-select v-model="state.toChainId" placeholder="Select" size="large">
      <el-option
        v-for="item in state.toChains"
        :key="item.id"
        :label="item.name"
        :value="item.id"
      />
    </el-select>
    <div class="home-item">
      <el-input
        size="large"
        v-model="state.amount"
        placeholder="Please input amount."
        style="width: 300px"
      />
    </div>
    <div v-if="state.amountsError" class="home-item amounts-error">{{ state.amountsError }}</div>
    <div v-if="state.amounts" class="home-item amounts">
      <div>
        payAmount: <span>{{ state.amounts.payAmountHm }}</span>
      </div>
      <div>
        receiveAmount: <span>{{ state.amounts.receiveAmountHm }}</span>
      </div>
    </div>
    <el-button
      :disabled="state.amountsError != ''"
      size="large"
      type="primary"
      @click="onConfirmTransfer"
      class="home-item"
    >
      Confirm Transfer
    </el-button>
    <el-collapse
      class="home-item"
      v-if="state.transferList.length > 0"
      v-model="state.collapseActive"
    >
      <el-collapse-item
        v-for="(item, index) in state.transferList"
        :title="`token: ${item.token.name}, fromChain: ${item.fromChain.name}, toChain: ${item.toChain.name}, amount: ${item.amount}`"
        :name="index"
      >
        <div class="transfer-list__result">
          {{ JSON.stringify(item.result) }}
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts">
import { Web3Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { computed, reactive, watch } from 'vue'
import { Bridge, BridgeChain, BridgeToken } from '../../../../src/orbiter-sdk'
import { equalsIgnoreCase } from '../../../../src/utils'
</script>

<script setup lang="ts">
const state = reactive({
  tokens: [] as BridgeToken[],
  fromChains: [] as BridgeChain[],
  toChains: [] as BridgeChain[],

  tokenAddress: '',
  fromChainId: undefined as undefined | number,
  toChainId: undefined as undefined | number,

  amount: '',

  amounts: undefined as
    | undefined
    | { payAmount: ethers.BigNumber; payAmountHm: string; receiveAmountHm: string },
  amountsError: '',

  transferList: [] as {
    token: BridgeToken
    fromChain: BridgeChain
    toChain: BridgeChain
    amount: string
    result: any
  }[],
  collapseActive: 0,
})

// computeds
const currentToken = computed(() =>
  state.tokens.find((item) => equalsIgnoreCase(item.address, state.tokenAddress))
)
const currentFromChain = computed(() =>
  state.fromChains.find((item) => item.id == state.fromChainId)
)
const currentToChain = computed(() => state.toChains.find((item) => item.id == state.toChainId))

// methods
const bridge = new Bridge('Testnet')
const refreshBridgeSupports = async () => {
  const supports = await bridge.supports(currentFromChain.value, currentToChain.value)

  state.fromChains = supports.fromChains
  state.toChains = supports.toChains
  state.fromChainId = state.fromChains.find(
    (item, index) => (!currentFromChain.value && index == 0) || currentFromChain.value.id == item.id
  )?.id
  state.toChainId = state.toChains.find(
    (item, index) => (!currentToChain.value && index == 0) || currentToChain.value.id == item.id
  )?.id

  // Token deduplicate
  state.tokens = supports.tokens
    .map((item) => {
      if (state.fromChainId == item.chainId) {
        return item
      }
      return undefined
    })
    .filter((item) => item !== undefined)
  state.tokenAddress = state.tokens.find(
    (item, index) =>
      (!currentToken.value && index == 0) || currentToken.value.address == item.address
  )?.address
}
refreshBridgeSupports()

const getAmounts = async () => {
  if (!state.amount) {
    return
  }

  try {
    state.amounts = await bridge.getAmounts(
      currentToken.value,
      currentFromChain.value,
      currentToChain.value,
      state.amount
    )
    state.amountsError = ''
  } catch (err) {
    state.amounts = undefined
    state.amountsError = err.message
  }
}

const ethereum = (window as any).ethereum
const onConfirmTransfer = async () => {
  try {
    const result = await bridge.transfer(
      new Web3Provider(ethereum).getSigner(),
      currentToken.value,
      currentFromChain.value,
      currentToChain.value,
      state.amount
    )

    state.transferList.unshift({
      token: currentToken.value,
      fromChain: currentFromChain.value,
      toChain: currentToChain.value,
      amount: state.amount,
      result,
    })
  } catch (err) {
    ElNotification({
      title: 'Error',
      message: `Fail: ${err.message}`,
      type: 'error',
    })
  }
}

// watchs
watch(
  () => [state.tokenAddress, state.fromChainId, state.toChainId],
  () => {
    refreshBridgeSupports()
    getAmounts()
  }
)
watch(
  () => state.amount,
  () => {
    getAmounts()
  }
)
</script>

<style>
.home {
  width: 800px;
  margin: 0 auto;
}
.el-select {
  margin-right: 12px;
}
.el-button {
  margin-top: 12px;
}
.home-item {
  margin-top: 20px;
}
.amounts-error {
  width: 500px;
  margin-left: auto;
  margin-right: auto;
  color: var(--el-color-danger);
  font-weight: bold;
}
.amounts {
  font-weight: bold;
  color: #666666;
}
.amounts span {
  color: var(--el-color-success);
}
.transfer-list__result {
  text-align: left;
  line-height: 15px;
  max-height: 200px;
  padding: 10px;
  overflow-y: scroll;
  word-wrap: break-word;
}
</style>
