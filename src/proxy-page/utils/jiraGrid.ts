export const columnConfig = {
  link: (name) => `{
        name: \`${name}\`,
        sort: { compare: (a, b) => (a?.data.name > b?.data.name ? 1 : -1) },
        formatter: (cell) => gridjs.html(cell?.data.map((item) => \`<a href="\${item.link}" target="_blank">\${item.name}</a>\`).join(' '))
      }`,
  date: (name) => `{
          name: \`${name}\`,
          sort: {
          compare: (a, b) => {
            var dateA = new Date(a?.data);
            var dateB = new Date(b?.data);
            return dateA > dateB ? 1 : (dateA < dateB ? -1 : 0);
        }
      },
        formatter: (cell) => gridjs.html(cell?.data.map((item) => \`\${item}\`))
      }`,
  normal: (name) => `{
        name: \`${name}\`,
        sort: { compare: (a, b) => (a?.data > b?.data ? 1 : -1) },
        formatter: (cell) => gridjs.html(cell?.data.map((item) => \`\${item}\`).join(' '))
      }`,
  status: (name) => `
      {
        name: \`${name}\`,
        sort: { compare: (a, b) => (a?.data[0].name > b?.data[0].name ? 1 : -1) },
        formatter: (cell) => gridjs.html(
          cell?.data.map(item => \`
            <div class="aui-lozenge" style="background-color:\${item.color};color:darkgrey;font-size: 11px;">\${item.name}</div>
          \`).join(' ')
        )
      }`,
  icon: (name) => `
      {
        name: \`${name}\`,
        sort: { compare: (a, b) => (a?.data[0].name > b?.data[0].name ? 1 : -1) },
        formatter: (cell) => gridjs.html(
          cell?.data.map(item => \`
            <div style="display: flex; align-items: center;">
              <img src="\${item.icon}" style="height:25px; margin-right: 5px;" />
            </div>
          \`).join(' ')
        )
      }`,
};

export const createTable = (index, gridjsColumns, preparedData) => `
  <div id="gridjs${index}"></div>
  <script>
    document.addEventListener('DOMContentLoaded', function () {
      new gridjs.Grid({
        columns: ${gridjsColumns},
        data: ${JSON.stringify(preparedData)},
        resizable: true,
        sort: true,
        search: {
          enabled: true,
          selector: (cell, rowIndex, cellIndex) => 
            cell?.data?.map(item => item?.name).filter(name => name).join(', ') || cell?.data
        },
        width: '100%',
        style: {
          td: {
            padding: '5px 5px',
            maxWidth: '200px',
            minWidth: '10px',
            overflow: 'auto',
          },
          th: {
            padding: '5px 5px'
          }
        }
      }).render(document.getElementById("gridjs${index}"));
    });
  </script>
`;
