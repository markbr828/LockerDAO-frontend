import { ethers } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as OlympusStaking } from "../abi/OlympusStakingv2.json";
import { abi as StakingHelper } from "../abi/StakingHelper.json";
import { abi as kageStakingAbi } from "../abi/KageStaking.json";
import { clearPendingTxn, fetchPendingTxns, getStakingTypeText } from "./PendingTxnsSlice";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAccountSuccess, getBalances } from "./AccountSlice";
import { error } from "../slices/MessagesSlice";
import { IActionValueAsyncThunk, IChangeApprovalAsyncThunk, IJsonRPCError } from "./interfaces";
import { segmentUA } from "../helpers/userAnalyticHelpers";
import { loadAccountDetails } from "./AccountSlice";
interface IUAData {
  address: string;
  value: string;
  approved: boolean;
  txHash: string | null;
  type: string | null;
}

export const changeApproval = createAsyncThunk(
  "stake/changeApproval",
  async ({ token, provider, address, networkID }: IChangeApprovalAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const kageContract = new ethers.Contract(addresses[networkID].KAGE_ADDRESS as string, ierc20Abi, signer);

    const kageStakingContrat = new ethers.Contract(addresses[networkID].KAGESTAKING_ADDRESS as string, kageStakingAbi, provider);

    let approveTx;
    try {
      approveTx = await kageContract.approve(
        addresses[networkID].KAGESTAKING_ADDRESS,
        ethers.utils.parseUnits("1000000000", "gwei").toString(),
      );

      const text = "Approve Staking";
      const pendingTxnType = "approve_staking";
      dispatch(fetchPendingTxns({ txnHash: approveTx.hash, text, type: pendingTxnType }));

      await approveTx.wait();
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
      return;
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }

    const kageAllowance = await kageContract.allowance(address, addresses[networkID].KAGESTAKING_ADDRESS);
    const kageBalance = await kageContract.balanceOf(address);
    const kageEarned = await kageStakingContrat.earned(address);

    return dispatch(
      fetchAccountSuccess({
        staking: {
          kageAllowance: ethers.utils.formatUnits(kageAllowance, "gwei"),
          kageBalance: ethers.utils.formatUnits(kageBalance, "gwei"),
          kageEarned: ethers.utils.formatUnits(kageEarned, "gwei"),
        },
      }),
    );
  },
);

export const changeStake = createAsyncThunk(
  "stake/changeStake",
  async ({ action, value, provider, address, networkID }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const kageStakingContrat = new ethers.Contract(addresses[networkID].KAGESTAKING_ADDRESS as string, kageStakingAbi, signer);

    let stakeTx;
    let uaData: IUAData = {
      address: address,
      value: value,
      approved: true,
      txHash: null,
      type: null,
    };
    try {
      if (action === "stake") {
        uaData.type = "stake";
        stakeTx = await kageStakingContrat.deposit(ethers.utils.parseUnits(value, "gwei"));
      } else {
        uaData.type = "unstake";
        stakeTx = await kageStakingContrat.withDraw(ethers.utils.parseUnits(value, "gwei"));
      }
      const pendingTxnType = action === "stake" ? "staking" : "withdrawing";
      uaData.txHash = stakeTx.hash;
      dispatch(fetchPendingTxns({ txnHash: stakeTx.hash, text: getStakingTypeText(action), type: pendingTxnType }));
      await stakeTx.wait();
      dispatch(loadAccountDetails({ networkID, address, provider }));
    } catch (e: unknown) {
      uaData.approved = false;
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(
          error("You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow"),
        );
      } else {
        console.log(e);
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (stakeTx) {
        segmentUA(uaData);

        dispatch(clearPendingTxn(stakeTx.hash));
      }
    }
    dispatch(getBalances({ address, networkID, provider }));
  },
);


export const claimReward = createAsyncThunk(
  "stake/claimReward",
  async ({ action, value, provider, address, networkID }: IActionValueAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const kageStakingContrat = new ethers.Contract(addresses[networkID].KAGESTAKING_ADDRESS as string, kageStakingAbi, signer);

    let stakeTx;
    
    try {
      stakeTx = await kageStakingContrat.claimReward();
      const pendingTxnType = "claiming";
      dispatch(fetchPendingTxns({ txnHash: stakeTx.hash, text: getStakingTypeText(action), type: pendingTxnType }));
      await stakeTx.wait();
      dispatch(loadAccountDetails({ networkID, address, provider }));
    } catch (e: unknown) {
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(
          error("You may be trying to stake more than your balance! Error code: 32603. Message: ds-math-sub-underflow"),
        );
      } else {
        console.log(e);
        dispatch(error(rpcError.message));
      }
      return;
    } finally {
      if (stakeTx) {
        dispatch(clearPendingTxn(stakeTx.hash));
      }
    }
    dispatch(getBalances({ address, networkID, provider }));
  },
);
