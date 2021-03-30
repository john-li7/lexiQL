import React, { useContext } from 'react';
import { VisualizerContext, CodeContext } from '../state/contexts';

export default function URIForm() {
  // const { visualizerDispatch } = useContext(VisualizerContext);
  const { codeDispatch } = useContext(CodeContext);

  // get the data from the sample DB
  const handleSampleData = (e) => {
    e.preventDefault();

    fetch('/example-schema')
      .then((res) => res.json())
      .then((data) => {
        visualizerDispatch({
          type: 'SET_TABLES',
          payload: {
            allTableNames: Object.keys(d),
          },
        });

        codeDispatch({
          type: 'SET_CODE',
          payload: {
            // schema: data.GQLSchema.types,
            // resolver: data.GQLSchema.resolvers,
            schema: 'abc',
            resolver: '!!!',
            test: '12345',
          },
        });
      });
  };

  // get data from user input DB
  const handleURI = (e) => {
    e.preventDefault();
    const URILink = document.getElementById('URILink').value;
    // if there's no input, do nothing
    if (!URILink) return;
    alert(URILink);

    fetch('/sql-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link: URILink }),
    })
      .then((res) => res.json())
      .then((data) => {
        // visualizerDispatch({
        //   type: 'SET_TABLE',
        //   payload: data,
        // });
        console.log('data: ', data);
        // codeDispatch({
        //   type: 'SET_CODE',
        //   payload:
        //     // schema: data.schema.types,
        //     // resolver: data.schema.resolvers,
        //     { test: Object.keys(data) },
        // });
      });
  };

  return (
    // <div>
    //   <div id="myModal" class="modal">
    //     <div class="modal-content">
    //       <span class="close">&times;</span>
    //       <p>Some text in the Modal..</p>
    //     </div>
    //   </div>
    <div id="uriForm">
      <form onSubmit={handleURI}>
        <label htmlFor="link">INPUT YOUR LINK:</label>
        <br />

        <input id="URILink" className="dbForm" />
        <br />

        <button className="URIbutton">Submit</button>
        <br />
      </form>

      <button
        type="button"
        className="sampleDataButton"
        onClick={handleSampleData}
      >
        Use Sample Database
      </button>
      <br />
    </div>
  );
}