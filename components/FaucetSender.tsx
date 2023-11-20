import { ChangeEvent, Component, MouseEvent } from "react";
import { StargateClient, Coin, SigningStargateClient } from "@cosmjs/stargate";
import { AccountData, ChainInfo, Window as KeplrWindow } from "@keplr-wallet/types";
import styles from '../styles/Home.module.css'

declare global {
    interface Window extends KeplrWindow {}
}

interface FaucetSenderState {
    denom: string
    faucetBalance: string
    myAddress: string
    myBalance: string
    toSend: string
}

export interface FaucetSenderProps {
    faucetAddress: string
    rpcUrl: string
}

export class FaucetSender extends Component<FaucetSenderProps, FaucetSenderState> {
    constructor(props:FaucetSenderProps) {
        super(props)
        this.state = {
            denom: "Loading...",
            faucetBalance: "Loading...",
            myAddress: "Click first",
            myBalance: "Click first",
            toSend: "0",
        }
        setTimeout(this.init, 500)
    }

    init = async() => this.updateFaucetBalance(
        
        await StargateClient.connect(this.props.rpcUrl)
    )

    updateFaucetBalance = async(client: StargateClient) => {
        const balances: readonly Coin[] = await client.getAllBalances(
            this.props.faucetAddress
        )
        const first: Coin = balances[0]
        this.setState({
            denom: first.denom,
            faucetBalance: first.amount,
        })
    }

    onToSendChanged = (e: ChangeEvent<HTMLInputElement>) => this.setState({
        toSend: e.currentTarget.value
    })

    onSendClicked = async(e: MouseEvent<HTMLButtonElement>) => {
        const { keplr } = window
        if (!keplr) {
            alert("You need to install or unlock Keplr")
            return
        }

        const { denom, toSend } = this.state
        const { faucetAddress, rpcUrl } = this.props

        await keplr.experimentalSuggestChain(this.getTestnetChainInfo())

        const offlineSigner = window.getOfflineSigner!("theta-testnet-001")
        const signingClient = await SigningStargateClient.connectWithSigner(
            rpcUrl,
            offlineSigner,
        )

        const account: AccountData = (await offlineSigner.getAccounts())[0]
        this.setState({
            myAddress: account.address,
            myBalance: (await signingClient.getBalance(account.address, denom)).amount,
        })

        const sendResult = await signingClient.sendTokens(
            account.address,
            faucetAddress,
            [
                {
                    denom: denom,
                    amount: toSend,
                },
            ],
            {
                amount: [{ denom: "ustom", amount: "500" }],
                gas: "20000",
            },
        )

        console.log(sendResult)
        this.setState({
            myBalance: (await signingClient.getBalance(account.address, denom)).amount,
            faucetBalance: (
                await signingClient.getBalance(faucetAddress, denom)
            ).amount,
        })
    }

    getTestnetChainInfo = (): ChainInfo => ({
        chainId: "theta-testnet-001",
        chainName: "theta-testnet-001",
        rpc: "https://rpc.sentry-01.theta-testnet.polypore.xyz/",
        rest: "https://rest.sentry-01.theta-testnet.polypore.xyz/",
        bip44: {
            coinType: 118,
        },
        bech32Config: {
            bech32PrefixAccAddr: "cosmos",
            bech32PrefixAccPub: "cosmos" + "pub",
            bech32PrefixValAddr: "cosmos" + "valoper",
            bech32PrefixValPub: "cosmos" + "valoperpub",
            bech32PrefixConsAddr: "cosmos" + "valcons",
            bech32PrefixConsPub: "cosmos" + "valconspub",
        },
        currencies: [
            {
                coinDenom: "ATOM",
                coinMinimalDenom: "uatom",
                coinDecimals: 6,
                coinGeckoId: "cosmos",
            },
            {
                coinDenom: "THETA",
                coinMinimalDenom: "theta",
                coinDecimals: 0,
            },
            {
                coinDenom: "LAMBDA",
                coinMinimalDenom: "lambda",
                coinDecimals: 0,
            },
            {
                coinDenom: "RHO",
                coinMinimalDenom: "rho",
                coinDecimals: 0,
            },
            {
                coinDenom: "EPSILON",
                coinMinimalDenom: "epsilon",
                coinDecimals: 0,
            },
        ],
        feeCurrencies: [
            {
                coinDenom: "ATOM",
                coinMinimalDenom: "uatom",
                coinDecimals: 6,
                coinGeckoId: "cosmos",
                gasPriceStep: {
                    low: 1,
                    average: 1,
                    high: 1,
                },
            },
        ],
        stakeCurrency: {
            coinDenom: "ATOM",
            coinMinimalDenom: "uatom",
            coinDecimals: 6,
            coinGeckoId: "cosmos",
        },
        coinType: 118,
        features: ["stargate", "ibc-transfer", "no-legacy-stdTx"],
    })
    
    

    render() {
        const { denom, faucetBalance, myAddress, myBalance, toSend } = this.state
        const { faucetAddress } = this.props
        console.log(toSend)

        return <div>
            <div className="styles.description">
                Send back to the faucet
            </div>
            <fieldset className="styles.card">
                <legend>Faucet</legend>
                <p>Address: {faucetAddress}</p>
                <p>Balance: {faucetBalance}</p>
            </fieldset>
            <fieldset className={styles.card}>
                <legend>You</legend>
                <p>Address: {myAddress}</p>
                <p>Balance: {myBalance}</p>
            </fieldset>
            <fieldset className={styles.card}>
                <legend>Send</legend>
                <p>To faucet:</p>
                <input value={toSend} type="number" onChange={this.onToSendChanged}/> {denom}
                <button onClick={this.onSendClicked}>Send to faucet</button>
            </fieldset>
        </div>
    }

}