import React, { useEffect, useState } from "react";
import styles from "./style.module.css";
import { Card, Table, Badge, Dropdown, ProgressBar } from "react-bootstrap";
import { MdClose } from "react-icons/md";
import { GOVERNANCE_ADDRESS, ESCROW_PROTOCOL } from "../../utils/address";
import GovernanceABI from "../../utils/abis/GovernanceABI.json";
import EscrowABI from "../../utils/abis/EscrowABI.json";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3Context } from "src/hooks";
import { Box } from "@material-ui/core";


const colors = ['Orange', 'DodgerBlue', 'Tomato', 'MediumSeaGreen', 'MediumSeaGreen'];
const titles = ['Pending', 'Active', 'Rejected', 'Passed', 'Enacted'];

const ResourceList = ({ }) => {
  const { id } = useParams();
  const { provider, hasCachedProvider, address, connected, connect, chainID } = useWeb3Context();

  const [voteinfo, setVoteInfo] = useState(null);
  const [yesamount, setYesAmount] = useState(0);
  const [noamount, setNoAmount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [votetype, setVoteType] = useState('Yes');

  async function fetchData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const GovernanceContract = new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI, provider);
    let temp = await GovernanceContract.proposals(id);
    console.log(temp);
    const _vote = {
      creator: temp.creator,
      detail: temp.detail,
      endTime: temp.endTime / 1,
      minApprovePercent: temp.minApprovePercent / 1,
      noamount: temp.noamount / 1,
      ptype: temp.ptype / 1,
      receipent: temp.receipent,
      startTime: temp.startTime / 1,
      status: temp.status / 1,
      supportPercent: temp.supportPercent / 1,
      title: temp.title,
      yesamount: temp.yesamount / 1
    };
    const escrowContract = new ethers.Contract(ESCROW_PROTOCOL, EscrowABI, provider);

    let _balance = 0;
    if (address)
      _balance = await escrowContract.balanceOf(address) / 1;
    setBalance(_balance);

    setVoteInfo(_vote);

    if (_vote.yesamount + _vote.noamount === 0) {
      setYesAmount(0);
      setNoAmount(0);
      return;
    }
    setYesAmount((_vote.yesamount * 100 / (_vote.yesamount + _vote.noamount)))
    setNoAmount((_vote.noamount * 100 / (_vote.yesamount + _vote.noamount)))
  }

  useEffect(() => {
    if (!id) return;
    fetchData()
  }, [id, address])

  const onStartVote = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const governanceContract = new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI, signer);
    try {
      await governanceContract.startVote(id);
      fetchData();
    }
    catch (error) {
      console.log(error);
    }
  }

  const onEndVote = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const governanceContract = new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI, signer);
    console.log(id)
    try {
      await governanceContract.endVote(id);
      fetchData();
    }
    catch (error) {
      console.log(error);
    }
  }

  const onVote = async () => {
    if (!balance) {
      alert("You are not allowed User");
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const governanceContract = new ethers.Contract(GOVERNANCE_ADDRESS, GovernanceABI, signer);
    try {
      await governanceContract.vote(id, 1, votetype === 'Yes' ? true : false);
      fetchData();
    }
    catch (error) {
      console.log(error);
    }
  }

  const reduceString = (string) => {
    const ellipsis = string ? string.slice(0, 6) + '...' + string.substring(string.length - 4, string.length) : '';
    return ellipsis
  }
  return (
    <>

      <Box className={styles.panel} fontSize={'16px'}>
        <Box fontSize={'32px'}>Voting</Box>
        <div className="d-flex justify-content-between text-white">
          <Card className="mt-5" style={{ borderRadius: '5px', width: '68%' }}>
            <Card.Body>
              <div style={{ fontSize: '24px' }}>
                {voteinfo && voteinfo.ptype === '0' ? 'Token' : 'Voting'}
              </div>
              <Box fontSize={'32px'} fontWeight={'bold'} mt={'10px'}>
                Vote #{id}
              </Box>
              <Box className="d-flex aiign-items-center mt-3">
                <div>
                  <div style={{ color: 'lightgrey' }}>DESCRIPTION</div>
                  {voteinfo && voteinfo.ptype === '0' ?
                    <div>Tokens (ESCR): Mint 1 tokens for {voteinfo && reduceString(voteinfo.receipent)}</div>
                    :
                    <div className="mt-2">{voteinfo && voteinfo.title}</div>
                  }
                </div>
                <div className="ml-5">
                  <div style={{ color: 'lightgrey' }}>CREATED BY</div>
                  <div className="mt-2">{voteinfo && reduceString(voteinfo.creator)}</div>
                </div>
              </Box>
              <div className="mt-3">
                <div>Vote</div>
                <div className="mt-2">
                  <ProgressBar variant="success" now={voteinfo && yesamount} style={{ backgroundColor: yesamount === 0 && noamount === 0 ? 'grey' : 'tomato' }} />
                </div>
              </div>
              <div className="mt-3">
                <div className="d-flex align-items-center">
                  <div className={styles.ellipse} style={{ backgroundColor: 'mediumseagreen' }} />
                  <div className="ml-2">Yes {yesamount}% {voteinfo && voteinfo.yesamount} ESCR</div>
                </div>
                <div className="d-flex align-items-center">
                  <div className={styles.ellipse} style={{ backgroundColor: 'tomato' }} />
                  <div className="ml-2">No {noamount} % {voteinfo && voteinfo.noamount} ESCR</div>
                </div>
              </div>
            </Card.Body>
          </Card>
          <div style={{ width: '30%' }}>
            <Card className="mt-5" style={{ borderRadius: '5px', height: 'fit-content' }}>
              <Card.Body>
                <div style={{ fontSize: '24px', borderBottom: "1px solid white" }} className="pb-3">Action</div>
                <div className="mt-2">
                  {
                    voteinfo && address && address.toLowerCase() === voteinfo.creator.toLowerCase() && voteinfo.status / 1 === 0 ? <button
                      // disabled={disabled}
                      className={styles.createbutton + " mt-4 w-100"}
                      onClick={() => onStartVote()}
                    >
                      Start Vote
                    </button> : ''
                  }
                  {voteinfo && address && address.toLowerCase() === voteinfo.creator.toLowerCase() && voteinfo.status / 1 === 1 ?
                    < button
                      // disabled={disabled}
                      className={styles.createbutton + " mt-3 w-100"}
                      onClick={() => onEndVote()}
                    >
                      End Vote
                    </button> : ''
                  }
                  {voteinfo && voteinfo.status / 1 === 1 ?
                    <>
                      <div className="mt-3">
                        <Dropdown onSelect={(e) => { setVoteType(e) }}>
                          <Dropdown.Toggle variant="secondary" >
                            {votetype}
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item eventKey="Yes">
                              Yes
                            </Dropdown.Item>
                            <Dropdown.Item eventKey="No">
                              No
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </div>
                      <button
                        // disabled={disabled}
                        className={styles.createbutton + " mt-3 w-100"}
                        onClick={() => onVote()}
                      >
                        Vote
                      </button>
                    </>
                    : ''
                  }
                </div>

              </Card.Body>
            </Card>
            <Card className="mt-5" style={{ borderRadius: '5px', height: 'fit-content' }}>
              <Card.Body>
                <div style={{ fontSize: '24px', borderBottom: "1px solid white" }} className="pb-3">Status</div>
                <div style={{ color: colors[voteinfo && voteinfo.status], fontSize: '20px' }} className={'mt-3'}>{voteinfo && titles[voteinfo.status]}</div>
                <div className="d-flex justify-content-between mt-2">
                  <div>Start Time</div>
                  <div className="mt-1">{voteinfo && (new Date(voteinfo.startTime * 1000).toLocaleDateString() + ' ' + new Date(voteinfo.startTime * 1000).toLocaleTimeString())}</div>
                </div>
                <div className="d-flex justify-content-between">
                  <div>End Time</div>
                  <div className="mt-1">{voteinfo && (new Date(voteinfo.endTime * 1000).toLocaleDateString() + ' ' + new Date(voteinfo.endTime * 1000).toLocaleTimeString())}</div>
                </div>
              </Card.Body>
            </Card>
            <Card className="mt-2" style={{ borderRadius: '5px', height: 'fit-content' }}>
              <Card.Body>
                <div style={{ fontSize: '24px', borderBottom: "1px solid white" }} className="pb-3">Support</div>
                <div className={'mt-3'}>{yesamount}% {'>'} ({voteinfo && voteinfo.supportPercent} % needed)</div>
                <div className="mt-2">
                  <ProgressBar variant="success" now={voteinfo && yesamount} style={{ backgroundColor: yesamount === 0 && noamount === 0 ? 'grey' : 'tomato' }} />
                </div>
              </Card.Body>
            </Card>
            <Card className="mt-2" style={{ borderRadius: '5px', height: 'fit-content' }}>
              <Card.Body>
                <div style={{ fontSize: '24px', borderBottom: "1px solid white" }} className="pb-3">Minimum Approval</div>
                <div className={'mt-3'}>{yesamount}% {'>'} ({voteinfo && voteinfo.minApprovePercent} % needed)</div>
                <div className="mt-2">
                  <ProgressBar variant="success" now={voteinfo && yesamount} style={{ backgroundColor: yesamount === 0 && noamount === 0 ? 'grey' : 'tomato' }} />
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Box>
    </>
  );
};
export default ResourceList;
