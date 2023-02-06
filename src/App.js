import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import './App.css';
import abi from './utils/WavePortal.json';

export const App = () =>  {
  const [ currentAccount, setCurrentAccount ] = useState('');
  const [ messageValue, setMessageValue ] = useState('');
  //すべてのwavesを保存する状態変数を定義する
  const [ allWaves, setAllWaves ] = useState([]);

  console.log(`currentAccount: ${currentAccount}`);
  const contractAddress = '0x1B7cFd18c9Bb485aE21e415CBb8825c53579d4A4';
  const contractABI = abi.abi;


  const getAllWaves = async() => {
    const { ethereum } = window;
    try{
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();
        const wavesCleand = waves.map(wave => {
          return{
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleand);
      }else{
        console.log('Ethereum object does not exist !')
      }

    }catch(error){
      console.log(error);
    }
  }

  // emit されたイベントに反応する
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        }
      ]);
    };

    if(window.ethereum){
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if(wavePortalContract){
        wavePortalContract.off('NewWave', onNewWave);
      }
    }
  }, [])


  const checkIfWalletIsConnected = async() => {
    try{
      // windows.ethereumにアクセスできることを確認する
      const { ethereum } = window;
      if(!ethereum){
        console.log('Make sure you have Metamask!');
        return;
      }else{
        console.log('We have the ethereum object', ethereum);
      }
  
      // ユーザーのウォレットへのアクセスが許可されているか確認します。
      const accounts = await ethereum.request({method: 'eth_accounts'});
      console.log('accounts: ', accounts);
      if(accounts.length !== 0){
        const account = accounts[0];
        console.log('Found an authorized account: ', account);
        setCurrentAccount(account);
        getAllWaves();
      }else{
        console.log('No authorized account found');
      }
    } catch(error){
      console.log(error);
    }
  };

  //connect wallet method
  const connectWallet = async() => {
    try{
      const { ethereum } = window;
      if(!ethereum){
        alert('Get MetaMask!');
        return;
      }
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('Connected: ', accounts[0]);
      setCurrentAccount(accounts[0]);
    
    }catch(error){
      console.log(error);
    }
  }

  const wave = async  () => {
    try{
      const { ethereum } = window;
      if(ethereum){
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer,
        );
        let count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count...', count.toNumber());
        let contractBalance = await provider.getBalance(wavePortalContract.address);
        console.log('Contract balance: ', ethers.utils.formatEther(contractBalance));

        // Contractにwaveを書き込む
        const waveTxn = await wavePortalContract.wave(messageValue, {gasLimit: 300000});
        console.log('Minting -> ', waveTxn.hash);
        // input areを空にする
        setMessageValue('');

        await waveTxn.wait();
        console.log('Mined -> ', waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log('Retrieved total wave count....', count.toNumber());

        let contractBalance_port = await provider.getBalance(wavePortalContract.address);
        // コントラクトの残高が減っていることを確認する
        if(contractBalance_port.lt((contractBalance))){
          console.log('User won ETH !!');
        }else{
          console.log("User didn't win ETH...");
        }
        console.log('Contract balance after wave: ', ethers.utils.formatEther(contractBalance_port));

      }else{
        console.log("Ethereum object doesn't exit!");
      }
    }catch(error){
      console.log(error);
    }
  }

  // web pageがロードされたときの処理 useEffect
 useEffect(() => {
  checkIfWalletIsConnected();
 }, []);

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="hand-wave">👋</span> WELCOME!
        </div>

        <div className="bio">
        イーサリアムウォレットを接続して、「<span role="img" aria-label="hand-wave">👋</span>(wave)」を送ってください<span role="img" aria-label="shine">✨</span>
        </div>

        

        {!currentAccount && (
          <button className='waveButton' onClick={connectWallet}>
            Connnect Wallet
          </button>
        )}
        {currentAccount && (
          <button className='waveButton' onClick={connectWallet}>
            Wallet Connected
          </button>
        )}

        {currentAccount && (
          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>
        )}

        {currentAccount &&(
          <textarea
            name='messageArea'
            placeholder='メッセージはこちら'
            type='text'
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
            style={{
              marginTop: '16px',
              padding: '4px',
              borderRadius: '4px',
              border: '2px solid #EFEFEF',
              outline: 'none',
            }}
          />
        )}

        {/* 履歴を表示する */}
        {currentAccount && 
          allWaves
            .slice(0)
            .reverse()
            .map((wave, index) => {
              return(
                <div
                  key={index}
                  style={{
                    backgroundColor: '#F8F8FF',
                    marginTop: '16px',
                    padding: '16px',
                  }}
                >
                  <div>Address: {wave.address}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div>Message: {wave.message}</div>
                </div>
              )
            })
        }
      </div>
    </div>
  );
}