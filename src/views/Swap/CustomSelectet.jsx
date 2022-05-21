import React, { useState } from "react";
import { Box, MenuItem, FormControl, Select, ListItemIcon, ListItemText} from "@material-ui/core";
import {Add, AirplaySharp, Airplay} from "@material-ui/icons";

const myTypes = {
  TYPE_1: "Type 1",
  TYPE_2: "Type 2",
  TYPE_3: "Type 3"
};

const TypeSelectMenuItem = (props) => {
  const renderIcon = () => {
    switch (props["data-value"]) {
      case myTypes.TYPE_1:
        return <Add />; // Material-UI icon
      case myTypes.TYPE_2:
        return <AirplaySharp />; // Material-UI icon
      case myTypes.TYPE_3:
        return <Airplay />; // Material-UI icon
      default:
        return <React.Fragment />;
    }
  };

  return (
    <MenuItem {...props}>
      <ListItemIcon>{renderIcon()}</ListItemIcon>
      <ListItemText primary={props["data-value"]} />
    </MenuItem>
  );
};

export default function CustomSelectet() {
  const [state, setState] = useState(myTypes.TYPE_1);
  const onChangeType = (e) => {
    setState(e.target.value);
  };

  return (
    <Box sx={{ m: 2 }}>
      <FormControl>
        <Select value={state} onChange={onChangeType} sx={{ width: 150 }}>
          {Object.keys(myTypes).map((type) => (
            <TypeSelectMenuItem value={myTypes[type]} key={type}>
              {myTypes[type]}
            </TypeSelectMenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
