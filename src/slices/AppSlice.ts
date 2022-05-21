import { ethers } from "ethers";
import axios from 'axios';
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as kageStakingAbi } from "../abi/KageStaking.json";
import { setAll, getTokenPrice, getMarketPrice, getDisplayBalance } from "../helpers";
import { NodeHelper } from "../helpers/NodeHelper";
import apollo from "../lib/apolloClient";
import { createSlice, createSelector, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { IBaseAsyncThunk } from "./interfaces";
import { allBonds, treasuryBalanceAll } from "src/helpers/AllBonds";
import ERC20 from '../lib/ERC20'
import { abi as DistributorContractAbi } from '../abi/DistributorContract.json'

const initialState = {
  loading: false,
  loadingMarketPrice: false,
};

export const loadAppDetails = createAsyncThunk(
  "app/loadAppDetails",
  async ({ networkID, provider }: IBaseAsyncThunk, { dispatch }) => {

    let marketPrice;
    try {
      const originalPromiseResult = await dispatch(
        loadMarketPrice({ networkID: networkID, provider: provider }),
      ).unwrap();
      const res = await axios.get("https://deep-index.moralis.io/api/v2/erc20/0x1Cc29Ee9dd8d9ed4148F6600Ba5ec84d7Ee85D12/price?chain=eth", {
        headers: { "X-API-Key": "YEEwMh0B4VRg6Hu5gFQcKxqinJ7UizRza1JpbkyMgNTfj4jUkSaZVajOxLNabvnt" },
      });
      // marketPrice = originalPromiseResult?.marketPrice;
      marketPrice = res.data.usdPrice;
    } catch (rejectedValueOrSerializedError) {
      // handle error here
      console.error("Returned a null response from dispatch(loadMarketPrice)");
      return;
    }


    if (!provider) {
      console.error("failed to connect to provider, please connect your wallet");
      return {
        stakingTVL: 0,
        marketPrice,
        marketCap: 0,
        circSupply: 0,

        totalSupply: 0,
        treasuryMarketValue: 0,
      };
    }
    const currentBlock = await provider.getBlockNumber();
    if (!addresses[networkID].STAKING_ADDRESS)
      return null;


    let endBlock = 0;

    const kageContrat = new ethers.Contract(addresses[networkID].KAGE_ADDRESS as string, ierc20Abi, provider);
    const kageStakingContrat = new ethers.Contract(addresses[networkID].KAGESTAKING_ADDRESS as string, kageStakingAbi, provider);

    const totalStaked = Number(getDisplayBalance(await kageStakingContrat.totalSupply(), 9));

    const totalSupply = Number(getDisplayBalance(await kageContrat.totalSupply(), 9));

    const circSupply = totalSupply - totalStaked;

    // Current index
    const currentIndex = 1;

    const marketCap = circSupply * marketPrice

    const Staked = totalStaked / totalSupply;

    const treasuryMarketValue = 0; // = await treasuryBalanceAll(networkID, provider)
    // console.error('董事会资产')
    // console.error(Staked)
    // console.error(treasuryMarketValue)
    const stakingTVL = marketCap * (Staked / 100)
    // console.error('--------totalValueLocked-------------')

    // const treasuryContract = new ERC20(addresses[networkID].TREASURY_ADDRESS,provider,'BUSD')

    // const stakingContract = new ethers.Contract(
    //   addresses[networkID].STAKING_ADDRESS as string,
    //   OlympusStakingv2,
    //   provider,
    // );

    return {
      currentIndex: ethers.utils.formatUnits(currentIndex, "gwei"),
      currentBlock,
      endBlock,
      fiveDayRate: 0,
      stakingAPY: 0,
      stakingTVL,
      Staked,
      stakingRebase: 0,
      marketCap,
      marketPrice,
      circVal: 0,
      circSupply,
      totalSupply,
      treasuryMarketValue
    } as IAppData;
  },
);

/**
 * checks if app.slice has marketPrice already
 * if yes then simply load that state
 * if no then fetches via `loadMarketPrice`
 *
 * `usage`:
 * ```
 * const originalPromiseResult = await dispatch(
 *    findOrLoadMarketPrice({ networkID: networkID, provider: provider }),
 *  ).unwrap();
 * originalPromiseResult?.whateverValue;
 * ```
 */
export const findOrLoadMarketPrice = createAsyncThunk(
  "app/findOrLoadMarketPrice",
  async ({ networkID, provider }: IBaseAsyncThunk, { dispatch, getState }) => {
    const state: any = getState();
    let marketPrice;
    // check if we already have loaded market price
    if (state.app.loadingMarketPrice === false && state.app.marketPrice) {
      // go get marketPrice from app.state
      marketPrice = state.app.marketPrice;
    } else {
      // we don't have marketPrice in app.state, so go get it
      try {
        const originalPromiseResult = await dispatch(
          loadMarketPrice({ networkID: networkID, provider: provider }),
        ).unwrap();
        marketPrice = originalPromiseResult?.marketPrice;
      } catch (rejectedValueOrSerializedError) {
        // handle error here
        console.error("Returned a null response from dispatch(loadMarketPrice)");
        return;
      }
    }
    return { marketPrice };
  },
);

/**
 * - fetches the OHM price from CoinGecko (via getTokenPrice)
 * - falls back to fetch marketPrice from ohm-dai contract
 * - updates the App.slice when it runs
 */
const loadMarketPrice = createAsyncThunk("app/loadMarketPrice", async ({ networkID, provider }: IBaseAsyncThunk) => {
  let marketPrice: number;
  try {
    marketPrice = await getMarketPrice({ networkID, provider });
    marketPrice = marketPrice;
  } catch (e) {
    marketPrice = 0;
  }
  return { marketPrice };
});

interface IAppData {
  readonly circSupply: number;
  readonly currentIndex?: string;
  readonly currentBlock?: number;
  readonly endBlock?: number;
  readonly fiveDayRate?: number;
  readonly marketCap: number;
  readonly circVal?: number;
  readonly marketPrice: number;
  readonly stakingAPY?: number;
  readonly stakingRebase?: number;
  readonly stakingTVL: number;
  readonly totalSupply: number;
  readonly treasuryMarketValue?: number;
  readonly Staked?: number;
}

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    fetchAppSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAppDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAppDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAppDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.error(error.name, error.message, error.stack);
      })
      .addCase(loadMarketPrice.pending, (state, action) => {
        state.loadingMarketPrice = true;
      })
      .addCase(loadMarketPrice.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loadingMarketPrice = false;
      })
      .addCase(loadMarketPrice.rejected, (state, { error }) => {
        state.loadingMarketPrice = false;
        console.error(error.name, error.message, error.stack);
      });
  },
});

const baseInfo = (state: RootState) => state.app;

export default appSlice.reducer;

export const { fetchAppSuccess } = appSlice.actions;

export const getAppState = createSelector(baseInfo, app => app);
