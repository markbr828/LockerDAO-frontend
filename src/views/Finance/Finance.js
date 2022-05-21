import React, { useEffect, useState } from "react";
import styles from "./style.module.css";
import { Card, Table, Badge, Dropdown, Tab, Nav } from "react-bootstrap";
import Sidebar from "../../components/MySideBar";
import { MdClose } from "react-icons/md";
import { ESCROW_PROTOCOL, FINANCE_ADDRESS } from "../../utils/address";
import FinanceABI from "../../utils/abis/FinanceABI.json";
import ERC20ABI from "../../utils/abis/ERC20ABI.json";
import axios from "axios";
import { ethers } from "ethers";
import { Box, Button } from "@material-ui/core";
import styled from "styled-components";
import { useWeb3Context } from "src/hooks";

const colors = ["red", "blue", "green", "dodgerblue"];
const Finance = ({ }) => {

  const { provider, hasCachedProvider, address, connected, connect, chainID } = useWeb3Context();

  const [sidebaropen, setSideBarOpen] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [validation, setValidation] = useState("");
  const [tokenlist, setTokenList] = useState([]);
  const [transferlist, setTransferList] = useState([]);
  const [sidebarshow, setSidebarShow] = useState('Deposit');

  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(0);
  const [tokenid, setTokenId] = useState(0);

  const [receipent, setReceipent] = useState('');

  async function getTokenData(token) {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const tokenContract = new ethers.Contract(token, ERC20ABI, provider);
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    let accountbalance = 0, contractbalance = 0;
    if (address) {
      accountbalance = await tokenContract.balanceOf(address) / Math.pow(10, decimals);
    }
    contractbalance = await tokenContract.balanceOf(FINANCE_ADDRESS) / Math.pow(10, decimals);
    return { token, name, symbol, decimals, accountbalance, contractbalance }
  }

  async function fetchData() {
    setDisabled(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const financeContract = new ethers.Contract(FINANCE_ADDRESS, FinanceABI, provider);
      const _tokenlist = await financeContract.getTokenList();
      let temp = []
      for (let i = 0; i < _tokenlist.length; i++) {
        const tokenInfo = await getTokenData(_tokenlist[i]);
        temp.push(tokenInfo);
      }
      setTokenList(temp);
      const transfercount = await financeContract.transferCount();
      temp = [];
      for (let i = 0; i < transfercount; i++) {
        const transfer = await financeContract.transfers(i);
        temp.push(transfer);
      }
      setTransferList(temp);
    }
    catch (error) {
      console.log(error);
    }
    setDisabled(false)
  }

  useEffect(() => {
    fetchData();
  }, [])

  const onDeposit = async () => {
    setDisabled(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(tokenlist[tokenid].token, ERC20ABI, signer);
      const temp = '0x' + (Math.pow(10, tokenlist[tokenid].decimals) * amount).toString(16);
      await tokenContract.approve(FINANCE_ADDRESS, temp);
      const financeContract = new ethers.Contract(FINANCE_ADDRESS, FinanceABI, signer);
      await financeContract.depositToken(tokenid, temp, reference);
      await fetchData();
    }
    catch (error) {
      console.log(error);
    }
    setDisabled(false);
  }

  const onWithdraw = async () => {
    setDisabled(true);
    try {
      const temp = '0x' + (Math.pow(10, tokenlist[tokenid].decimals) * amount).toString(16);
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const signer = provider.getSigner();
      const financeContract = new ethers.Contract(FINANCE_ADDRESS, FinanceABI, signer);
      console.log(tokenid);
      await financeContract.withdraw(receipent, temp, tokenid, reference);
      await fetchData();
    }
    catch (error) {
      console.log(error);
    }
    setDisabled(false);
  }

  const reduceString = (string) => {
    const ellipsis = string ? string.slice(0, 6) + '...' + string.substring(string.length - 4, string.length) : '';
    return ellipsis
  }
  return (
    <>
      <Sidebar open={sidebaropen} setOpen={setSideBarOpen}>
        <div className={styles.header}>
          <Box fontSize={'21px'} mt={'20px'}>New transfer</Box>
          <MdClose fontSize={20} onClick={() => setSideBarOpen(false)} />
        </div>
        <div className="mt-3">
          <Tab.Container defaultActiveKey={'Deposit'}>
            <Nav as="ul" className="nav-pills mb-4 light">
              <Nav.Item as="li">
                <Nav.Link eventKey={'Deposit'}>
                  <Box fontSize={'18px'} className="mt-2">Deposit</Box>
                </Nav.Link>
              </Nav.Item>

              <Nav.Item as="li">
                <Nav.Link eventKey={'Withdraw'}>
                  <Box fontSize={'18px'} className="mt-2">Withdraw</Box>
                </Nav.Link>
              </Nav.Item>
            </Nav>
            <Tab.Content className="pt-1">
              <Tab.Pane eventKey={'Deposit'}>
                <div>
                  Token <span>*</span>
                </div>
                <div className={styles.inputpanel}>
                  <div className="mb-3">
                    <Dropdown onSelect={(e) => { setTokenId(e) }}>
                      {tokenlist.length ? <Dropdown.Toggle variant="primary" >
                        {tokenlist[tokenid].symbol} ({tokenlist[tokenid].name}) {reduceString(tokenlist[tokenid].token)}
                      </Dropdown.Toggle> : ''}
                      <Dropdown.Menu>
                        {tokenlist.map((data, i) => {
                          return <Dropdown.Item eventKey={i}>
                            {tokenlist[i].symbol} ({tokenlist[i].name}) {reduceString(tokenlist[i].token)}
                          </Dropdown.Item>
                        })}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                  <div>
                    Amount <span>*</span>
                  </div>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value / 1)}
                  />

                  <div className="mt-4">
                    REFERENCE (OPTIONAL)
                  </div>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                  <Box mt={'10px'}>
                    <Button
                      variant="contained"
                      color="primary"
                      className="connect-button w-100"
                      disabled={disabled}
                      onClick={() => onDeposit(true)}
                    >
                      Submit Deposit
                    </Button>
                  </Box>
                </div>
                <div className={styles.actionpanel + " " + styles.primaryaction}>
                  <p className="text-xs">Configure your deposit above, and sign the transaction with your wallet after clicking "Submit Transfer". It will then show up in your Finance app once processed.</p>
                </div>
              </Tab.Pane>
              <Tab.Pane eventKey={'Withdraw'}>
                <div className={styles.inputpanel}>

                  <div>
                    RECIPIENT (MUST BE A VALID ETHEREUM ADDRESS) <span>*</span>
                  </div>
                  <input
                    type="text"
                    value={receipent}
                    onChange={(e) => setReceipent(e.target.value)}
                  />

                  <div className="mt-2">
                    Amount <span>*</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value / 1)}
                    />
                    <Dropdown onSelect={(e) => { setTokenId(e) }}>
                      {tokenlist.length ? <Dropdown.Toggle variant="primary" >
                        {tokenlist[tokenid].symbol}
                      </Dropdown.Toggle> : ''}
                      <Dropdown.Menu>
                        {tokenlist.map((data, i) => {
                          return <Dropdown.Item eventKey={i}>
                            {tokenlist[i].symbol}
                          </Dropdown.Item>
                        })}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                  <div className="mt-4">
                    REFERENCE (OPTIONAL)
                  </div>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
                <Box mt={'10px'}>
                  <Button
                    variant="contained"
                    color="primary"
                    className="connect-button w-100"
                    disabled={disabled}
                    onClick={() => onWithdraw(true)}
                  >
                    Submit Witdraw
                  </Button>
                </Box>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </div>

      </Sidebar>
      <div className={styles.panel}>
        <div className="d-flex justify-content-between">
          <Box fontSize={'32px'}>Finance</Box>
          <Button
            variant="contained"
            color="primary"
            className="connect-button"
            onClick={() => setSideBarOpen(true)}
          >
            New Transfer
          </Button>
        </div>
        <div>
          <Card className="mt-5 w-100 mr-3">
            <Card.Body>
              <Table>
                <thead>
                  <tr>
                    <th style={{ fontSize: '18px' }}>Token Balances</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontSize: '18px' }} className={'text-white'}>
                      <div className="d-flex">
                        {tokenlist.map((data, i) => {
                          if (!data.contractbalance) return '';
                          return <div className="mt-2">
                            <div className="mr-5">
                              {data.symbol}
                            </div>
                            <div className="mt-2">
                              {data.contractbalance}
                            </div>
                          </div>
                        })}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="mt-5 w-100 mr-3">
            <Card.Body>

              <Table>
                <thead>
                  <tr >
                    <th style={{ fontSize: '18px' }}>DATE</th>
                    <th style={{ fontSize: '18px' }}>SOURCE/RECIPIENT</th>
                    <th style={{ fontSize: '18px' }}>REFERENCE</th>
                    <th style={{ fontSize: '18px' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {transferlist.map((data, i) => {
                    return <tr key={1000 + i} className='text-white' style={{ fontSize: '18px' }}>
                      <td>{new Date(data.date * 1000).toLocaleDateString()}</td>
                      <td>{reduceString(data.source)}</td>
                      <td>{data.refer}</td>
                      <td>{data.t === '1' ? '+' : '-'} {data.amount / Math.pow(10, tokenlist[data.tokenId].decimals)} {tokenlist[data.tokenId].symbol}</td>
                    </tr>
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
};
export default Finance;
