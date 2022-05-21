import React, { useEffect, useState } from "react";
import styles from "./style.module.css";
import { Card, Table, Badge, Dropdown } from "react-bootstrap";
import Sidebar from "../../components/MySideBar";
import { MdClose } from "react-icons/md";
import { ESCROW_PROTOCOL } from "../../utils/address";
import EscrowFactory from "../../utils/abis/EscrowFactory.json";
import EscrowABI from "../../utils/abis/EscrowABI.json";
import axios from "axios";
import { ethers } from "ethers";
import { Box, Button, FormControl, Select, MenuItem, FormHelperText } from "@material-ui/core";
import { useWeb3Context } from "src/hooks";
import styled from "styled-components";

const colors = ["red", "blue", "green", "dodgerblue"];
const ResourceList = ({ }) => {
  const { provider, hasCachedProvider, address, connected, connect, chainID } = useWeb3Context();
  console.log(address);
  const [sidebaropen, setSideBarOpen] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [validation, setValidation] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [tokencount, setTokenCount] = useState(0);
  const [holders, setHolders] = useState([]);
  const [tokeninfo, setTokenInfo] = useState(null);
  const [totalbalance, setTotalBalance] = useState(0);
  const [isAddToken, setIsAddToken] = useState(false);

  async function fetchData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const escrowContract = new ethers.Contract(ESCROW_PROTOCOL, EscrowABI, provider);

    const name = await escrowContract.name();
    const totalSupply = await escrowContract.totalSupply() / 1;
    console.log(totalSupply);
    // const transfersEnabled = await escrowContract.methods
    //   .transfersEnabled()
    //   .call();
    const symbol = await escrowContract.symbol();
    const controller = await escrowContract.owner();
    setTokenInfo({
      totalSupply,
      transfersEnabled: 'Yes',
      name,
      symbol,
      controller,
    });
    let result = await axios.get(
      `https://api-testnet.bscscan.com/api?module=account&action=tokentx&contractaddress=${ESCROW_PROTOCOL}`
    );
    if (!result.data.result.length) return;
    console.log(result);
    result = result.data.result;
    let temp = [],
      _totalbalance = 0;
    for (let i = 0; i < result.length; i++) {
      const filter = temp.filter((data) => data.address === result[i].to);
      if (filter.length) continue;
      const balance = await escrowContract.balanceOf(result[i].to) / 1;
      _totalbalance += balance;
      if (balance > 0) temp.push({ address: result[i].to, balance });
    }
    setHolders(temp);
    setTotalBalance(_totalbalance);
  }
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!tokencount || !ethers.utils.isAddress(recipientAddress)) {
      setDisabled(true);
      return;
    }
    if (tokencount === 1) setDisabled(false);
    else {
      setValidation(
        "You are trying to assign an amount that is greater than the maximum amount of tokens that can be assigned (1 ESCR )."
      );
    }
  }, [recipientAddress, tokencount]);

  const onAddTokens = async () => {
    console.log(address, tokeninfo.controller);

    if (tokeninfo.controller.toLowerCase() !== address.toLowerCase()) {
      setValidation(
        "The action failed to execute. You may not have the required permissions."
      );
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const escrowContract = new ethers.Contract(ESCROW_PROTOCOL, EscrowABI, signer);

    setDisabled(true);
    try {
      await escrowContract.methods
        .generateTokens(recipientAddress, tokencount);
      await fetchData();
      setDisabled(false);
    } catch (error) {
      console.log(error);
      setDisabled(false);
    }
  };

  const onRemoveTokens = async () => {
    console.log(address, tokeninfo.controller);
    if (tokeninfo.controller.toLowerCase() !== address.toLowerCase()) {
      setValidation(
        "The action failed to execute. You may not have the required permissions."
      );
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const escrowContract = new ethers.Contract(ESCROW_PROTOCOL, EscrowABI, signer);
    try {
      setDisabled(true);
      await escrowContract.methods
        .destroyTokens(recipientAddress, tokencount)
      await fetchData();
      setDisabled(false);
    } catch (error) {
      console.log(error);
      setDisabled(false);
    }
  };

  return (
    <>
      <Sidebar open={sidebaropen} setOpen={setSideBarOpen}>
        <div className={styles.header}>
          <Box fontSize={'21px'} mt={'20px'}>{isAddToken ? 'Add tokens' : 'Remove tokens'}</Box>
          <MdClose fontSize={20} onClick={() => setSideBarOpen(false)} />
        </div>
        <div className={styles.actionpanel + " " + styles.primaryaction}>
          <strong>Action</strong>
          <p className="text-xs">
            This action will create tokens and transfer them to the recipient
            below.
          </p>
        </div>
        <div className={styles.inputpanel}>
          <div>
            RECIPIENT (MUST BE A VALID ETHEREUM ADDRESS) <span>*</span>
          </div>
          <input
            type="text"
            value={recipientAddress}
            onChange={(event) =>
              isAddToken && setRecipientAddress(event.target.value)
            }
          />

          <div className="mt-4">
            NUMBER OF TOKENS TO ADD <span>*</span>
          </div>
          <input
            type="text"
            value={tokencount}
            onChange={(event) => setTokenCount(event.target.value / 1)}
          />
          <Box width={'100%'} mt={'10px'}>
            {isAddToken ? (
              <Button
                variant="contained"
                disabled={disabled}
                color="primary"
                className="connect-button w-100"
                onClick={() => onAddTokens()}
              >
                Add tokens
              </Button>
            ) : (
              <Button
                variant="contained"
                disabled={disabled}
                color="primary"
                className="connect-button w-100"
                onClick={() => onRemoveTokens()}
              >
                Remove tokens
              </Button>
            )}
          </Box>
        </div>
        {validation.length ? (
          <div className={styles.actionpanel + " " + styles.secondaryaction}>
            <p className="text-xs">{validation}</p>
          </div>
        ) : (
          ""
        )}
      </Sidebar>
      <StyledContainer className={styles.panel}>
        <div className="d-flex justify-content-between">
          <Box fontSize={'36px'}>Tokens</Box>
          <Button
            variant="contained"
            color="primary"
            className="connect-button"
            onClick={() => {
              setSideBarOpen(true);
              setIsAddToken(true);
            }}
          >
            Add tokens
          </Button>
        </div>
        <div className="d-flex justify-content-between">
          <Card className="mt-5 w-75 mr-3" style={{ fontSize: '16px' }}>
            <Card.Body>
              <Table>
                <thead>
                  <tr>
                    <th style={{ fontSize: '16px' }}>No</th>
                    <th style={{ fontSize: '16px' }}>Holders</th>
                    <th style={{ fontSize: '16px' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map((data, i) => {
                    return (
                      <tr className="text-white">
                        <td>{i}</td>
                        <td>{data.address}</td>
                        <td >
                          <div className="mr-3 text-white text-center">{data.balance}</div>
                        </td>
                        <td>
                          
                          <Box className="basic-dropdown">
                            <Dropdown>
                              <Dropdown.Toggle variant="primary" >
                                Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  href="#"
                                  onClick={() => {
                                    setIsAddToken(false);
                                    setSideBarOpen(true);
                                    setRecipientAddress(data.address);
                                  }}
                                >
                                  Remove token
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                  Add custom label
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </Box>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          <div className="w-25">
            <Card className="mt-5" style={{ height: "unset" }}>
              <Card.Body>
                <Table>
                  <thead>
                    <tr>
                      <th className="w-100"><Box fontSize={'21px'}>Token Info</Box></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ fontSize: '16px' }}>
                      <td className="d-flex w-100 justify-content-between">
                        <div>Total Supply</div>
                        <strong className="text-white">{tokeninfo && tokeninfo.totalSupply}</strong>
                      </td>
                      <td className="d-flex w-100 justify-content-between">
                        <div>Transferable</div>
                        <strong className="text-white">
                          {tokeninfo && tokeninfo.transfersEnabled}
                        </strong>
                      </td>
                      <td className="d-flex w-100 justify-content-between">
                        <div>Token</div>
                        <strong className="text-white">
                          {tokeninfo &&
                            `${tokeninfo.name.slice(0, 5)}...(${tokeninfo.symbol
                            })`}
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
            <Card className="mt-5" style={{ height: "unset" }}>
              <Card.Body>
                <Table>
                  <thead>
                    <tr>
                      <th className="w-100" style={{ fontSize: '18px' }}>DISTRIBUTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ fontSize: '16px' }}>
                      <td>
                        <div className="mt-2">Tokenholder stakes</div>
                        <div className="d-flex mt-3">
                          {holders.map((data, i) => {
                            return (
                              <div
                                className={styles.progress}
                                style={{
                                  backgroundColor: colors[i],
                                  width: `calc(100% / ${holders.length})`,
                                }}
                              />
                            );
                          })}
                        </div>
                        <div className="mt-4">
                          {holders.map((data, i) => {
                            const ellipsis =
                              data.address.slice(0, 6) +
                              "..." +
                              data.address.substring(
                                data.address.length - 4,
                                data.address.length
                              );
                            return (
                              <div className="d-flex justify-content-between text-white mt-2">
                                <div className="d-flex align-items-center">
                                  <div
                                    className={styles.ellipse}
                                    style={{ backgroundColor: colors[i] }}
                                  />
                                  <div className="ml-3">{ellipsis}</div>
                                </div>
                                <div>
                                  {(
                                    (data.balance / totalbalance) *
                                    100
                                  ).toFixed(2)}
                                  %
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        </div>
      </StyledContainer>
    </>
  );
};

const StyledContainer = styled(Box)`
  .dropdown-toggle{
    color: #333333;
    border: 0;
    font-weight: 500;
    background-color: #F8CC82;
    font-size: 1rem;
    padding : 6px 16px;
    border-radius : 5px;
  }
`;
export default ResourceList;
