import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  Tab,
  Tabs,
  Typography,
  Zoom,
} from "@material-ui/core";
import NewReleases from "@material-ui/icons/NewReleases";
import RebaseTimer from "../../components/RebaseTimer/RebaseTimer";
import TabPanel from "../../components/TabPanel";
import { getOhmTokenImage, getTokenImage, trim } from "../../helpers";
import { changeApproval, changeStake, claimReward } from "../../slices/StakeThunk";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import "./stake.scss";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { Skeleton } from "@material-ui/lab";
import ExternalStakePool from "./ExternalStakePool";
import { error } from "../../slices/MessagesSlice";
import { ethers } from "ethers";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const sOhmImg = getTokenImage("sohm");
const ohmImg = getOhmTokenImage(16, 16);

function Stake() {
  const dispatch = useDispatch();
  const { provider, address, connected, connect, chainID } = useWeb3Context();

  const [zoomed, setZoomed] = useState(false);
  const [view, setView] = useState(0);
  const [quantity, setQuantity] = useState("");

  const isAppLoading = useSelector(state => state.app.loading);
  const currentIndex = useSelector(state => {
    return state.app.currentIndex;
  });
  const fiveDayRate = useSelector(state => {
    return state.app.fiveDayRate;
  });
  const kageBalance = useSelector(state => {
    return state.account.staking && state.account.staking.kageBalance;
  });
  const oldSohmBalance = useSelector(state => {
    return state.account.balances && state.account.balances.oldsohm;
  });
  const stakedBalance = useSelector(state => {
    return state.account.staking && state.account.staking.stakedBalance;
  });
  const fsohmBalance = useSelector(state => {
    return state.account.balances && state.account.balances.fsohm;
  });
  const wsohmBalance = useSelector(state => {
    return state.account.balances && state.account.balances.wsohm;
  });
  const kageAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.kageAllowance;
  });

  const kageEarned = useSelector(state => {
    return state.account.staking && state.account.staking.kageEarned;
  });

  const unstakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.ohmUnstake;
  });
  const stakingRebase = useSelector(state => {
    return state.app.stakingRebase;
  });
  const stakingAPY = useSelector(state => {
    return state.account.staking && state.account.staking.rewardRate;
  });
  const stakingTVL = useSelector(state => {
    return state.account.staking && state.account.staking.totalStaked;
  });

  const pendingTransactions = useSelector(state => {
    return state.pendingTransactions;
  });

  const setMax = () => {
    if (view === 0) {
      setQuantity(kageBalance);
    } else {
      setQuantity(stakedBalance);
    }
  };

  const onSeekApproval = async token => {
    await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
  };

  const onChangeStake = async action => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(quantity) || quantity === 0 || quantity === "" || !quantity) {
      // eslint-disable-next-line no-alert
      return dispatch(error("Please enter a value!"));
    }

    // 1st catch if quantity > balance
    let gweiValue = ethers.utils.parseUnits(quantity, "gwei");
    if (action === "stake" && gweiValue.gt(ethers.utils.parseUnits(kageBalance, "gwei"))) {
      return dispatch(error("You cannot stake more than your LOCKER balance."));
    }

    if (action === "unstake" && gweiValue.gt(ethers.utils.parseUnits(stakedBalance, "gwei"))) {
      return dispatch(error("You cannot unstake more than your sCST balance."));
    }

    await dispatch(changeStake({ address, action, value: quantity.toString(), provider, networkID: chainID }));
  };

  const onClaimReward = async action => {
    await dispatch(claimReward({ address, action, value: quantity.toString(), provider, networkID: chainID }));
  };

  const hasAllowance = useCallback(
    token => {
      return kageAllowance > 0;
    },
    [kageAllowance],
  )

  let modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      Connect Wallet
    </Button>,
  )

  const changeView = (event, newView) => {
    setView(newView);
  }

  const trimmedBalance = Number(
    [stakedBalance]
      .filter(Boolean)
      .map(balance => Number(balance))
      .reduce((a, b) => a + b, 0)
      .toFixed(4),
  );
  const trimmedStakingAPY = trim(stakingAPY, 1);
  const stakingRebasePercentage = trim(stakingRebase * 100, 4);

  return (
    <div id="stake-view">
      <Zoom in={true} onEntered={() => setZoomed(true)}>
        <Paper className={`ohm-card`}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <div className="card-header">
                <Typography variant="h5">Stake </Typography>
                <Typography variant="body2"><Skeleton width="155px" /></Typography>
              </div>
            </Grid>

            <Grid item>
              <div className="stake-top-metrics">
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={6} md={6} lg={6}>
                    <div className="stake-apy">
                      <Typography variant="h5" color="textSecondary">
                        APY
                      </Typography>
                      <Typography variant="h4">
                        {stakingAPY ? (
                          <>{new Intl.NumberFormat("en-US").format(trimmedStakingAPY)}%</>
                        ) : (
                          <Skeleton width="150px" />
                        )}
                      </Typography>
                    </div>
                  </Grid>

                  <Grid item xs={12} sm={6} md={6} lg={6}>
                    <div className="stake-tvl">
                      <Typography variant="h5" color="textSecondary">
                        Total Value Deposited
                      </Typography>
                      <Typography variant="h4">
                        {stakingTVL ? (
                          new Intl.NumberFormat("en-US", {
                            maximumFractionDigits: 0,
                            minimumFractionDigits: 0,
                          }).format(stakingTVL) + ' LOCKER'
                        ) : (
                          <Skeleton width="150px" />
                        )}
                      </Typography>
                    </div>
                  </Grid>
                </Grid>
              </div>
            </Grid>

            <div className="staking-area">
              {!address ? (
                <div className="stake-wallet-notification">
                  <div className="wallet-menu" id="wallet-menu">
                    {modalButton}
                  </div>
                  <Typography variant="h6">Connect your wallet to stake LOCKER</Typography>
                </div>
              ) : (
                <>
                  <Box className="stake-action-area">
                    <Tabs
                      key={String(zoomed)}
                      centered
                      value={view}
                      textColor="primary"
                      indicatorColor="primary"
                      className="stake-tab-buttons"
                      onChange={changeView}
                      aria-label="stake tabs"
                    >
                      <Tab label="Stake" {...a11yProps(0)} />
                      <Tab label="Withdraw" {...a11yProps(1)} />
                      <Tab label="Claim" {...a11yProps(2)} />
                    </Tabs>
                    <Box className="help-text">
                      {address && ((!hasAllowance("ohm") && view === 0) || (!hasAllowance("sohm") && view === 1)) && (
                        <Typography variant="body2" className="stake-note" color="textSecondary">
                          Note: The "Approve" transaction is only needed when staking/unstaking for the first time;
                          subsequent staking/unstaking only requires you to perform the "Stake" or "Unstake"
                          transaction.
                        </Typography>
                      )}
                    </Box>
                    <Box className="stake-action-row " display="flex" alignItems="center">
                      {
                        view != 2 ?
                          <FormControl className="ohm-input" variant="outlined" color="primary">
                            <InputLabel htmlFor="amount-input"></InputLabel>
                            <OutlinedInput
                              id="amount-input"
                              type="number"
                              placeholder="Enter an amount"
                              className="stake-input"
                              value={quantity}
                              onChange={e => setQuantity(e.target.value)}
                              labelWidth={0}
                              endAdornment={
                                <InputAdornment position="end">
                                  <Button variant="text" onClick={setMax} color="inherit">
                                    Max
                                  </Button>
                                </InputAdornment>
                              }
                            />
                          </FormControl> : <></>
                      }
                      <TabPanel value={view} index={0} className="stake-tab-panel">
                        {address && hasAllowance("ohm") ? (
                          <Button
                            className="stake-button"
                            variant="contained"
                            color="primary"
                            disabled={isPendingTxn(pendingTransactions, "staking")}
                            onClick={() => {
                              onChangeStake("stake");
                            }}
                          >
                            {txnButtonText(pendingTransactions, "staking", "Stake LOCKER")}
                          </Button>
                        ) : (
                          <Button
                            className="stake-button"
                            variant="contained"
                            color="primary"
                            disabled={isPendingTxn(pendingTransactions, "approve_staking")}
                            onClick={() => {
                              onSeekApproval("ohm");
                            }}
                          >
                            {txnButtonText(pendingTransactions, "approve_staking", "Approve")}
                          </Button>
                        )}

                      </TabPanel>

                      <TabPanel value={view} index={1} className="stake-tab-panel">
                        <Button
                          className="stake-button"
                          variant="contained"
                          color="primary"
                          disabled={isPendingTxn(pendingTransactions, "unstaking")}
                          onClick={() => {
                            onChangeStake("unstake");
                          }}
                        >
                          {txnButtonText(pendingTransactions, "unstaking", "Withdraw LOCKER")}
                        </Button>
                      </TabPanel>
                      <TabPanel value={view} index={2} className="stake-tab-panel">
                        <Button
                          className="stake-button"
                          variant="contained"
                          color="primary"
                          disabled={isPendingTxn(pendingTransactions, "claiming") | true}
                          onClick={() => {
                            onClaimReward();
                          }}
                        >
                          {txnButtonText(pendingTransactions, "unstaking", "Claim LOCKER")}
                        </Button>
                      </TabPanel>
                    </Box>
                  </Box>

                  <div className={`stake-user-data`}>
                    <div className="data-row">
                      <Typography variant="body1">Your Balance</Typography>
                      <Typography variant="body1">
                        {isAppLoading ? <Skeleton width="80px" /> : <>{trim(kageBalance, 4)} LOCKER</>}
                      </Typography>
                    </div>

                    <div className="data-row">
                      <Typography variant="body1">Your Staked Balance</Typography>
                      <Typography variant="body1">
                        {isAppLoading ? <Skeleton width="80px" /> : <>{trimmedBalance} LOCKER</>}
                      </Typography>
                    </div>

                    <div className="data-row">
                      <Typography variant="body1">Claimable Reward Amount</Typography>
                      <Typography variant="body1">
                        {isAppLoading ? <Skeleton width="80px" /> : <>{trim(kageEarned, 2)} LOCKER</>}
                      </Typography>
                    </div>
                    <div className="data-row">
                      <Typography variant="body1">Lock Days</Typography>
                      <Typography variant="body1">
                        {isAppLoading ? <Skeleton width="80px" /> : <>60 days</>}
                      </Typography>
                    </div>
                    <div className="data-row">
                      <Typography variant="body1">Withdraw Fees (30days)</Typography>
                      <Typography variant="body1">
                        {isAppLoading ? <Skeleton width="80px" /> : <> 7%</>}
                      </Typography>
                    </div>
                    <div className="data-row">
                      <Typography variant="body1">Withdraw Fees (60days)</Typography>
                      <Typography variant="body1">
                        {isAppLoading ? <Skeleton width="80px" /> : <> 5%</>}
                      </Typography>
                    </div>
                    <div className="data-row">
                      <Typography variant="body1">Withdraw Fees (90days)</Typography>
                      <Typography variant="body1">
                        {isAppLoading ? <Skeleton width="80px" /> : <> 0%</>}
                      </Typography>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Grid>
        </Paper>
      </Zoom>

      {/* <ExternalStakePool /> */}
    </div>
  );
}

export default Stake;
