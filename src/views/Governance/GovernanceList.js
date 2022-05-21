import React, { useEffect, useState } from "react";
import styles from "./style.module.css";
import { Card, Table, Badge, Dropdown, ProgressBar } from "react-bootstrap";
import Sidebar from "../../components/MySideBar";
import { MdClose } from "react-icons/md";
import { GOVERNANCE_ADDRESS } from "../../utils/address";
import GovernanceABI from "../../utils/abis/GovernanceABI.json";
import axios from "axios";
import { Link } from "react-router-dom";
import { ethers } from "ethers";
import styled from "styled-components";
import { Box, Button } from "@material-ui/core";

const colors = ['Orange', 'DodgerBlue', 'Tomato', 'MediumSeaGreen', 'MediumSeaGreen'];
const ResourceList = ({ }) => {
  const [sidebaropen, setSideBarOpen] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [votetype, setVoteType] = useState("Token");
  const [question, setQuestion] = useState('');
  const [mintamount, setMintAmount] = useState(1);
  const [supportamount, setSupportAmount] = useState(50);
  const [minapproveamount, setMinApproveAmount] = useState(20);

  const [votes, setVotes] = useState([]);
  async function fetchData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const GovernanceContract = new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI, provider);
    const votecount = await GovernanceContract.proposalCount();
    let temp = [];
    for (let i = 0; i < votecount; i++) {
      const _vote = await GovernanceContract.proposals(i);
      temp.push(_vote);
    }
    setVotes(temp);
    console.log(votecount);
  }

  useEffect(() => {
    fetchData()
  }, [])
  useEffect(() => {
    if ((votetype === 'Token' &&
      !ethers.utils.isAddress(recipientAddress)) ||
      !supportamount ||
      !minapproveamount ||
      !question.length
    ) {
      setDisabled(true);
      return;
    }
    setDisabled(false);
  }, [recipientAddress, supportamount, minapproveamount, question, votetype])

  const onCreateVote = async () => {
    setDisabled(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      const signer = provider.getSigner();
      const GovernanceContract = new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI, signer);
      await GovernanceContract.createProposal(
        votetype === "Token" ? 0 : 1,
        question,
        '',
        supportamount,
        minapproveamount,
        votetype === "Token" ? recipientAddress : '0x0000000000000000000000000000000000000000'
      );
      setDisabled(false);

    }
    catch (error) {
      console.log(error);
      setDisabled(false);
    }
  }

  return (
    <>
      <Sidebar open={sidebaropen} setOpen={setSideBarOpen}>
        <div className={styles.header}>
          <Box fontSize={'21px'} mt={'10px'}>New Vote</Box>
          <MdClose fontSize={20} onClick={() => setSideBarOpen(false)} />
        </div>

        <div className={styles.inputpanel}>
          <Dropdown onSelect={(e) => { setVoteType(e) }}>
            <Dropdown.Toggle variant="primary" >
              {votetype}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="Token">
                Token
              </Dropdown.Item>
              <Dropdown.Item eventKey="Voting">
                Voting
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <div className="mt-2">
            Question <span>*</span>
          </div>
          <input
            type="text"
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
          />
          {votetype === 'Token' ?
            <>
              <div className="mt-2">
                Receipient Address <span>*</span>
              </div>
              <input
                type="text"
                value={recipientAddress}
                onChange={(event) =>
                  setRecipientAddress(event.target.value)
                }
              />

              <div className="mt-2">
                Number of Tokens to Mint<span>*</span>
              </div>
              <input
                type="text"
                value={mintamount}
              />
            </> : ''}

          <div className="mt-2">
            Support Amount<span>*</span>
          </div>
          <input
            type="text"
            value={supportamount}
            onChange={(e) => setSupportAmount(e.target.value)}
          />

          <div className="mt-2">
            Minimum Approve Amount<span>*</span>
          </div>
          <input
            type="text"
            value={minapproveamount}
            onChange={(e) => setMinApproveAmount(e.target.value)}
          />
          <div className={styles.actionpanel + " " + styles.primaryaction}>
            <strong>Action</strong>
            <p className="text-xs">
              These votes are informative and used for signaling. They don’t have any direct repercussions on the organization.
            </p>
          </div>
          <Box mt={'10px'}>
            <Button
              variant="contained"
              disabled={disabled}
              color="primary"
              className="connect-button w-100"
              onClick={() => onCreateVote()}
            >
              Create new vote
            </Button>
          </Box>

        </div>

      </Sidebar>
      <div className={styles.panel}>
        <div className="d-flex justify-content-between">
          <Box fontSize={'32px'}>Voting</Box>
          <Button
            variant="contained"
            color="primary"
            className="connect-button"
            onClick={() => setSideBarOpen(true)}
          >
            New vote
          </Button>
        </div>
        <StyledContainer className="mt-5 w-100">
          <Box className="d-flex align-items-center justify-content-between" maxWidth={'350px'}>
            <div className="basic-dropdown">
              <Dropdown>
                <Dropdown.Toggle variant="primary" >
                  Status
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>
                    All
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Open
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Closed
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>&nbsp;&nbsp;&nbsp;&nbsp;
            <div className="basic-dropdown">
              <Dropdown>
                <Dropdown.Toggle variant="primary">
                  Outcome
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>
                    All
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Passed
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Rejected
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Enacted
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Pending
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>&nbsp;&nbsp;&nbsp;&nbsp;
            <div className="basic-dropdown">
              <Dropdown>
                <Dropdown.Toggle variant="primary">
                  App
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>
                    All
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Voting
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    Tokens
                  </Dropdown.Item>
                  <Dropdown.Item href="#">
                    External
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Box>
          <div className={styles.votepanel}>
            {votes && votes.map((data, i) => {
              return (
                <Link to={'/governance/' + i}>
                  <Card className="mt-5 cursor-pointer" style={{ borderRadius: '5px', width: '300px' }}>
                    <Card.Body><div className="text-white" >
                      <div className="mt-1" style={{ fontSize: '24px' }}>{data.ptype === '0' ? 'Token' : 'Voting'}</div>
                      {data.ptype === '0' ?
                        <div className="mt-1 "><span style={{ fontWeight: 'black', fontSize: '18px' }}>#{i}: </span>Tokens(ESCR): Mint 1 tokens for {data.receipent}</div>
                        : <div className="mt-1" style={{ height: '100px' }}><span style={{ fontWeight: 'black', fontSize: '18px' }}>#{i}: </span>{data.title}</div>}
                      <div className="mt-2">Yes</div>
                      <ProgressBar variant="success" now={data.yesamount * 100 / (data.yesamount / 1 + data.noamount / 1)} style={{ height: '6px' }} />
                      <div className="mt-3">No</div>
                      <ProgressBar variant="danger" now={data.noamount * 100 / (data.yesamount / 1 + data.noamount / 1)} style={{ height: '6px' }} />
                      <div style={{ color: colors[data.status / 1], fontWeight: 'bold' }} className="mt-4">
                        {data.status / 1 === 0 && 'Pending'}
                        {data.status / 1 === 1 && 'Active'}
                        {data.status / 1 === 2 && 'Rejected'}
                        {data.status / 1 === 3 && 'Passed'}
                        {data.status / 1 === 4 && 'Enacted'}
                      </div>
                    </div>

                    </Card.Body>
                  </Card>
                </Link>
              )
            })}
          </div>
        </StyledContainer>

      </div>
    </>
  );
};

const StyledContainer = styled(Box)`
  border-radius : 5px;
  .dropdown-toggle{
    color: #333333;
    border: 0;
    font-weight: 500;
    background-color: #F8CC82;
    font-size : 21px;
    padding : 6px 16px;
    border-radius : 5px;
  }
`;
export default ResourceList;
