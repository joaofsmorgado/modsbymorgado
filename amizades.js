/*
 * Script Name: Friend Request
 * Version: v1.0.4
 * Last Updated: 2022-10-27
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2021-09-20
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'friendRequest',
        name: 'Pedidos de Amizade em Massa by',
        version: 'v1.0.4',
        author: 'RedAlert e modificado por João Morgado',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/friend-request.287581/',
    },
    translations: {
        en_DK: {
            'Friend Request': 'Pedidos de Amizade em Massa',
            Help: 'Suporte',
            'Fetching world data ...': 'A recolher a informação do mundo...',
            Rank: 'Posição',
            Player: 'Jogador',
            Tribe: 'Tribo',
            Villages: 'Aldeia(s)',
            Points: 'Pontos',
            Action: 'Ações',
            'Add as friend': 'Adicionar como amigo',
            'There was an error fetching the friends list!':
                'Houve um erro ao solicitar a lista de amigos!',
            'Redirecting...': 'A redirecionar...',
            'There was an error!': 'Ups! Parece que houve um erro.',
        },
    },
    allowedMarkets: [],
    allowedScreens: ['buddies'],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidScreen = twSDK.checkValidLocation('screen');

        if (isValidScreen) {
            try {
                initMain();
            } catch (error) {
                UI.ErrorMessage(twSDK.tt('There was an error!'));
                console.error(`${scriptInfo} Error:`, error);
            }
        } else {
            UI.InfoMessage(twSDK.tt('Redirecting...'));
            twSDK.redirectTo('buddies');
        }

        // Initialize main script logic
        async function initMain() {
            const players = await twSDK.worldDataAPI('player');

            // Obter informação das tribos
            const tribes = await twSDK.worldDataAPI('ally');

            const currentFriends = fetchCurrentFriendsList();

            // sort and filter
            const sortedPlayersByRank = players.sort((a, b) => a[5] - b[5]);

            const currentFriendIds = currentFriends.map((friend) =>
                parseInt(friend.id)
            );

            const filteredPlayers = sortedPlayersByRank.filter((player) =>
                player.push(currentFriendIds.includes(parseInt(player[0])))
            );

            const playersTable = buildPlayersTable(
                filteredPlayers,
                tribes
            );

            const content = `
                <div class="ra-mb15 ra-mh400">
                    ${playersTable}
                </div>
            `;

            const customStyle = `
                .ra-mh400 { overflow-y: auto; max-height: 400px; }
                .ra-existing-player td { background-color: #ffca6a !important; }
                .btn-confirm-yes { padding: 3px; }
            `;

            twSDK.renderFixedWidget(
                content,
                'raFriendRequest',
                'ra-friend-request',
                customStyle,
                '560px'
            );

            // register action Handlers
            onClickAddFriend();
        }

        // Action Handler: Add to friend click handler
        function onClickAddFriend() {
            jQuery('.btn-add-friend').on('click', function () {
                const addFriendLink = jQuery(this).attr('data-href');

                jQuery(this).addClass('btn-confirm-yes');

                jQuery('.btn-add-friend').attr(
                    'disabled',
                    'disabled'
                );

                setTimeout(() => {
                    jQuery('.btn-add-friend').removeAttr('disabled');
                }, twSDK.delayBetweenRequests);

                jQuery.get(addFriendLink);
            });
        }

        // Helper: Build the players table
        function buildPlayersTable(players, tribes) {
            let playersTable = `
                <table class="ra-table" width="100%">
                    <thead>
                        <tr>
                            <th>${twSDK.tt('Rank')}</th>
                            <th class="ra-tal">${twSDK.tt('Player')}</th>
                            <th>${twSDK.tt('Tribe')}</th>
                            <th>${twSDK.tt('Villages')}</th>
                            <th>${twSDK.tt('Points')}</th>
                            <th>${twSDK.tt('Action')}</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            players.forEach((player) => {
                const [
                    id,
                    name,
                    tribeId,
                    villages,
                    points,
                    rank,
                    existing
                ] = player;

                /*
                 * O player.txt fornece o ID da tribo.
                 * Aqui procuramos esse ID no ally.txt.
                 */
                const tribe = tribes.find(
                    (tribe) =>
                        parseInt(tribe[0]) === parseInt(tribeId)
                );

                /*
                 * No ally.txt:
                 * [0] = ID da tribo
                 * [1] = Nome da tribo
                 * [2] = Tag da tribo
                 */
                const tribeName = tribe ? tribe[1] : '';

                const hash = game_data.csrf;

                if (name !== undefined && id) {
                    playersTable += `
                        <tr class="${
                            existing ? 'ra-existing-player' : ''
                        }">
                            <td>${rank}</td>

                            <td class="ra-tal">
                                <a href="/game.php?screen=info_player&id=${id}"
                                   target="_blank"
                                   rel="noopener noreferrer">
                                    ${twSDK.cleanString(name)}
                                </a>
                            </td>

                            <td>
                                ${
                                    tribeName
                                        ? twSDK.cleanString(tribeName)
                                        : '-'
                                }
                            </td>

                            <td>
                                ${twSDK.formatAsNumber(villages)}
                            </td>

                            <td>
                                ${twSDK.formatAsNumber(points)}
                            </td>

                            <td>
                                <span class="btn btn-add-friend ${
                                    existing ? 'btn-disabled' : ''
                                }"
                                data-href="/game.php?screen=info_player&id=${id}&action=add_friend&h=${hash}">
                                    ${twSDK.tt('Add as friend')}
                                </span>
                            </td>
                        </tr>
                    `;
                }
            });

            playersTable += `</tbody></table>`;

            return playersTable;
        }

        // Helper: Get current friends list
        function fetchCurrentFriendsList() {
            const currentFriends = [];

            const currentFriendsTable = jQuery(
                '#content_value > table:nth-child(6) > tbody > tr'
            ).not(':eq(0)');

            const friendRequestsTable = jQuery(
                '#content_value > table:nth-child(8) > tbody > tr'
            ).not(':eq(0)');

            const incomingFriendsTable = jQuery(
                '#content_value > table:nth-child(10) > tbody > tr'
            ).not(':eq(0)');

            currentFriendsTable.each(function () {
                const playerName = jQuery(this)
                    .find('td:eq(1)')
                    .text()
                    .trim();

                const playerLink = jQuery(this)
                    .find('td:eq(1) a')
                    .attr('href');

                const playerId = twSDK.getParameterByName(
                    'id',
                    window.location.origin + playerLink
                );

                currentFriends.push({
                    id: parseInt(playerId),
                    name: playerName,
                });
            });

            friendRequestsTable.each(function () {
                const playerName = jQuery(this)
                    .find('td:eq(0)')
                    .text()
                    .trim();

                const playerLink = jQuery(this)
                    .find('td:eq(0) a')
                    .attr('href');

                const playerId = twSDK.getParameterByName(
                    'id',
                    window.location.origin + playerLink
                );

                currentFriends.push({
                    id: parseInt(playerId),
                    name: playerName,
                });
            });

            incomingFriendsTable.each(function () {
                const playerName = jQuery(this)
                    .find('td:eq(0)')
                    .text()
                    .trim();

                const playerLink = jQuery(this)
                    .find('td:eq(0) a')
                    .attr('href');

                const playerId = twSDK.getParameterByName(
                    'id',
                    window.location.origin + playerLink
                );

                currentFriends.push({
                    id: parseInt(playerId),
                    name: playerName,
                });
            });

            return currentFriends;
        }
    }
);
