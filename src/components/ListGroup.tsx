//import { Fragment } from "react";
import { useState } from "react";

function ListGroup() {
  let items = [
    'New York',
    'San Francisco',
    'Tokyo',
    'London',
    'Paris'
  ];

  //let selectedIndex = 0; 
  // Hook 
  const [selectedIndex, setSelectedIndex] = useState(-1); 
  // const [name, setName] = useState(''); 

  // event handler 
  //const handleClick = (event: React.MouseEvent) => console.log(event); 

  return (
    <>
      <h1>List</h1>
      {items.length === 0 && <p>No items in the list</p>}
      <ul className="list-group">
        {items.map((item, index) => (
          <li 
            className = {selectedIndex === index ? 'list-group-item active' : 'list-group-item'}
            key = {item}
            onClick = {() => setSelectedIndex(index)}
          
          >{item}
          </li>))}
      </ul>
    </>
  );
}

export default ListGroup;