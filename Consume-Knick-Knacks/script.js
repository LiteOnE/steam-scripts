//Author: Lite_OnE
//Version: 1.0
//Copyright: XEOX INC.

const appID = 991980;

//exclude non knick knacks consumables
const classIDsBlackList = [
    "2838587436" /*mystery box "unpack_2018mystery"*/
];
var classIDsToConsume = [];
var assetIDsToConsume = [];

const timeout = 500;//ms

var modal     = null;

var limit = 0;

var activated = 0;
var errored   = 0;

var startTime = 0;

function msToTimeStr(_t)
{
    let ret = "";
    
    ret = (_t % 1000) + " ms";

    _t = Math.floor(_t / 1000);

    let sec = _t % 60;

    if(sec > 0)
    {
        ret = sec + " sec " + ret;
    }
    
    _t = Math.floor(_t / 60);

    let min = _t % 60;
    
    if(min > 0)
    {
        ret = min + " min " + ret;
    }

    _t = Math.floor(_t / 60);

    if(_t > 0)
    {
        ret = _t + " h " + ret;
    }

    return ret;
}

function ConsumeAssetID(i = 0)
{
    var rgAJAXParams = {
		sessionid: g_sessionID,
		appID: appID,
		item_type: 100,//use generic 100
		assetid: assetIDsToConsume[i],
		actionparams: '{"action":"consume_winter2018"}'
	};
	var strActionURL = g_strProfileURL + "/ajaxactivateconsumable/";

    $J.post( strActionURL, rgAJAXParams).done(
        function(data){
            let t = i + 1;
            
            if(data["bActivated"])
            {
                modal.Dismiss();

                activated += 1;
            }
            else
            {
                modal.Dismiss();
                
                errored += 1
            }

            modal = ShowBlockingWaitDialog( 'Consuming', '<div style="display: inline-block;margin-left: 20px;">' +
                    `<span style="color: lightseagreen;">Consuming Knick-Knacks: ${t}/${assetIDsToConsume.length}</span>`
                    + (errored ? `<br><span style="color:#b698cc;">Failed: ${errored}</span>` : '') + '</div>' );
        }
    ).fail(
        function(data){
            console.log(data);

            errored += 1
            //alert("Unexpected error! Check console log for details");
        }
    );

    i += 1;

    if(i < limit)
    {
        setTimeout(() => {
            ConsumeAssetID(i);
        }, timeout);
    }
    else
    {
        modal.Dismiss();

        let timePassed = msToTimeStr((new Date()).getTime() - startTime);

        modal = ShowConfirmDialog('Completed!', `Successfully consumed <span style="color: lightseagreen;">${activated} Knick-Knacks</span> Time passed: ${timePassed}`
            + (errored ? `<br><br><span style="color:#ff7b7b;">Failed ${errored} Requests -- Check Console Log for the Info` : ''));
    }
}

var batch = 1;
function FetchAssetIDs(start = 0)
{
    modal = ShowBlockingWaitDialog( 'Info', `Processing inventory items info. <span style="color:#b698cc;">Batch: ${batch}</span>` );
    
    $J.get("/inventory/" + g_steamID + "/753/6?count=2000&start_assetid=" + start).done(function(inventory)
    {
        inventory["descriptions"].forEach(d =>
        {
            d["tags"].forEach(t =>
            {
                if(t["internal_name"] == "item_class_6")
                {
                    if(!classIDsBlackList.includes(d["classid"]))
                    {
                        classIDsToConsume.push(d["classid"]);
                    }
                }
            });
        });

        inventory["assets"].forEach(a =>
        {
            if(classIDsToConsume.includes(a["classid"]))
            {
                assetIDsToConsume.push(a["assetid"]);
            }
        });

        if(inventory["more_items"])
        {
            modal.Dismiss();
            
            batch += 1;
            
            FetchAssetIDs(inventory["last_assetid"]);
        }
        else
        {
            console.log(assetIDsToConsume);
            
            modal.Dismiss();
            modal = ShowConfirmDialog('Warning', `Found <span style="color:#b698cc;">${assetIDsToConsume.length} Knick-Knacks!</span>` + 
                '<br><br><span style="color:lightseagreen;">Limit consuming</span>' +
                '<input type="text" id="knacks_limit" style="margin-left: 20px;"><br><br>'
            ).done(function()
            {
                console.log("okay");
                
                if($J('#knacks_limit').val())
                {
                    limit = parseInt($J('#knacks_limit').val());

                    console.log("limit parsed: " + limit);

                    if(limit > assetIDsToConsume.length)
                    {
                        limit = assetIDsToConsume.length;
                    }

                    console.log("limit: " + limit);

                    if(limit > 0)
                    {
                        startTime = (new Date()).getTime();
                        console.log("start consuming");
                        ConsumeAssetID();
                    }
                }
            });

            $J('#knacks_limit').val(assetIDsToConsume.length);
        }
        
    }).fail(
        function(data){
            console.log(data);
            alert("Error loading the inventory!");
        }
    );
}

//starting point
FetchAssetIDs();