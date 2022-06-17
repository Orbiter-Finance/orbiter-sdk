import axios from 'axios'
import config from '../../config/chains_api'

export async function getAllZksTokenList(localChainID) {
    return new Promise(async (resolve, reject) => {
        if (localChainID !== 12 && localChainID !== 512) {
            resolve([]);
            return
        }
        let isContiue = true
        let startID = 0
        let zksTokenAllList = []
        try {
            while (isContiue) {
                var zksTokenListReq = {
                    from: startID,
                    limit: 100,
                    direction: 'newer',
                    localChainID: localChainID,
                }
                let zksList = await getZKSTokenList(zksTokenListReq)
                if (zksList.length !== 100) {
                    isContiue = false
                } else {
                    startID = zksList[99].id + 1
                }
                zksTokenAllList = zksTokenAllList.concat(zksList)
            }
            let zksTokenResult = {
                chainID: localChainID,
                tokenList: zksTokenAllList,
            }
            resolve(zksTokenResult);
        } catch (error) {
            console.log('zk_TokenListGetError =', error)
            reject(error);
        }
    })
}
async function getZKSTokenList(req) {
    const url = `${req.localChainID === 512 ? config.zkspace.Testnet : config.zkspace.Mainnet
        }/tokens?from=${req.from}&limit=${req.limit}&direction=${req.direction}`
    try {
        const response = await axios.get(url)
        if (response.status === 200) {
            var respData = response.data
            if (respData.success) {
                return respData.data
            } else {
                throw new Error(`respData.status not success`)
            }
        } else {
            throw new Error(`getZKSTokenList NetWorkError`)
        }
    } catch (error) {
        console.error('getZKSTokenList error =', error)
        throw new Error(`getZKSTokenList error = ${error.message}`)
    }
}