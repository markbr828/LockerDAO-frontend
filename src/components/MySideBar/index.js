import React, { useEffect, useRef } from "react";
import styles from "./style.module.css";
import { Box } from "@material-ui/core";
import styled from "styled-components";

const Sidebar = ({ open, children, setOpen }) => {
  const sidebar = useRef(null);
  useEffect(() => {
    document.addEventListener("mousedown", function (event) {
      if (sidebar.current && !sidebar.current.contains(event.target)) {
        setOpen(false);
      }
    });
  }, []);
  return (
    <StyledContainer
      className={open ? styles.sidebar + " " + styles.expand : styles.sidebar}
      ref={sidebar}
    >
      {children}
    </StyledContainer>
  );
};

const StyledContainer = styled(Box)`
  backdrop-filter : blur(33px);
  background-color : #0005;
  .dropdown-toggle{
    color: #333333;
    border: 0;
    font-weight: 500;
    background-color: #F8CC82;
    font-size : 21px;
    padding : 6px 16px;
    border-radius : 5px;
  }
  .nav-link{
    color: #333333;
    border: 0;
    font-weight: 500;
    background-color: #F8CC82;
    font-size : 21px;
    padding : 10px 16px;
    border-radius : 0px;
    cursor : pointer;
    >div{
      margin : 0!important;
    }
  }
  .nav-link.active{
    color : lightcoral!important;
  }
`;
export default Sidebar;
