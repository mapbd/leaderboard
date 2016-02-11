import React from 'react';
import {Cell, Table, Column} from 'fixed-data-table';
import R from 'ramda';
import moment from 'moment';

var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC'
};

function reverseSortDirection (sortDir) {
  return sortDir === SortTypes.ASC ? SortTypes.DESC : SortTypes.ASC;
}

var SortHeaderCell = React.createClass({
  render: function () {
    var {sortDir, children, ...props} = this.props;
    return (
      <Cell className='LB-header-descriptor' {...props}>
        <a onClick={this._onSortChange}>
          {children} {sortDir ? (sortDir === SortTypes.ASC ? '↑' : '↓') : '↕'}
        </a>
      </Cell>
    );
  },

  _onSortChange: function (e) {
    e.preventDefault();

    if (this.props.onSortChange) {
      this.props.onSortChange(
        this.props.columnKey,
        this.props.sortDir
          ? reverseSortDirection(this.props.sortDir)
          : SortTypes.ASC
      );
    }
  }
});

function StatsCell (props) {
  var {rowIndex, data, field, ...other} = props;
  if (!data[rowIndex]) return <Cell></Cell>;
  var display = data[rowIndex][field];
  if (field === 'created_at') {
    display = moment(display).fromNow();
  } else if (field === 'roads') {
    display = (display).toFixed(1)+ " km";
  }
  return (
    <Cell className='statsCell' {...other } >
      { display }
    </Cell>
  );
}

const LinkCell = (props) => {
  var {rowIndex, data, field, ...other} = props;
  if (!data[rowIndex]) return <Cell></Cell>;

  var userid = props.data[rowIndex].user_id;
  var userlink = "http://devseed.com/osm-gamification-users/#/"+userid
  var userClass = data[rowIndex].team + '-name statsCell table-username';

  var display = data[rowIndex][field];
  if (field === 'created_at') {
    display = moment(display).fromNow();
  }

  return (
    <Cell className={userClass} {...other } >
      <a href={userlink}>{ display }</a>
    </Cell>
  );
};

function RankCell (props) {
  var {rowIndex, data, ...other} = props;
  if (!data[rowIndex]) return <Cell></Cell>;

  var display = rowIndex + 1;
  var rankClass = data[rowIndex].team + ' rankCell';
  return (
    <Cell className={rankClass} {...other } >
      { display }
    </Cell>
  );
}

export default React.createClass({
  getInitialState: function () {
    return {
      sortedDataList: [],
      list: [],
      colSortDirs: {}
    };
  },
  setTableData: function (props) {
    var colors = props.colors;
    var rows = props.rows;

    var list = [];
    Object.keys(rows).forEach((key) => {
      rows[key].forEach((row) => {
        row.team = colors[key];
        row.hashtag = key;
        list.push(row);
      });
    });

    this.setState({
      sortedDataList: R.reverse(R.sortBy(R.prop('edits'), list)),
      list: list,
      colSortDirs: {}
    });
  },
  componentDidMount: function (props) {
    if (props && props.hasOwnProperty('colors') && props.hasOwnProperty('rows')) this.setTableData(props);
  },
  componentWillReceiveProps: function (props) {
    if (props && props.hasOwnProperty('colors') && props.hasOwnProperty('rows')) this.setTableData(props);
  },
  _onFilterChange: function (e) {
    if (e.target.value.length === 0 || !e.target.value) {
      this.setState({
        sortedDataList: this.state.list
      });
      return;
    }

    var filterBy = e.target.value.toLowerCase();
    var list = this.state.sortedDataList;
    var filteredList = R.filter(function (element) {
      var {name} = element;
      return (name.toLowerCase().indexOf(filterBy) !== -1);
    }, list);

    this.setState({
      sortedDataList: filteredList
    });
  },
  _onSortChange: function (columnKey, sortDir) {
    var list = this.state.sortedDataList;

    var sortedList = list;
    if (columnKey === 'created_at') {
      sortedList = R.sortBy(function (element) {
        var n = moment(R.prop('created_at', element)).valueOf();
        return n;
      }, list);
    } else {
      sortedList = R.sortBy(R.prop(columnKey), list);
    }
    if (sortDir === SortTypes.ASC) {
      sortedList = R.reverse(sortedList);
    }
    this.setState({
      sortedDataList: sortedList,
      colSortDirs: {
        [columnKey]: sortDir
      }
    });
  },
  render: function () {
    var {sortedDataList, colSortDirs} = this.state;
    return (
      <div>
        <section className="section-leaderboard">
          <div className="row">
            <h2 className="section-header">Leaderboard</h2>
        <div className='search-bar-input-test'>
          <input onChange={this._onFilterChange}
            className='search-bar-input'
            name='query' type='text'
            maxLength='100'
            autoCapitalize='none'
            autoComplete='off'
            autoCorrect='off'
            placeholder='User Searchbar'/>
          <div className='search-bar-side'>
            <div className='search-glass'><div style={{'WebkitTransform': 'rotate(45deg)', 'MozTransform': 'rotate(45deg)', 'OTransform': 'rotate(45deg)'}}>&#9906;</div></div>
          </div>
        </div>
        <br />
        <div className='Table-Container'>
        <Table
          rowsCount={sortedDataList.length}
          rowHeight={60}
          width={1100}
          height={500}
          headerHeight={30}>
          <Column
            columnKey='Rank'
            header=
              {<SortHeaderCell
                onSortChange={this._onSortChange}
                sortDir={colSortDirs.hashtag} >
                RANK
              </SortHeaderCell>}            
            cell={<RankCell data={sortedDataList} />}
            width={48}
            fixed={true}

          />
          <Column
            columnKey='name'
            header={
              <SortHeaderCell
                onSortChange={this._onSortChange}
                sortDir={colSortDirs.name} >
                NAME
              </SortHeaderCell>
            }
            cell={<LinkCell data={sortedDataList} field='name' />}
            width={200}
          />
          <Column
            columnKey='hashtag'
            header={
              <SortHeaderCell
                onSortChange={this._onSortChange}
                sortDir={colSortDirs.hashtag} >
                TEAM
              </SortHeaderCell>}
            cell={<StatsCell data={sortedDataList} field='hashtag' />}
            width={150}
          />
          <Column
            columnKey='edits'
            header={
              <SortHeaderCell
                onSortChange={this._onSortChange}
                sortDir={colSortDirs.edits} >
                EDITS
              </SortHeaderCell>}
            cell={<StatsCell data={sortedDataList} field='edits' />}
            width={100}
            flexGrow={1}
          />
          <Column
            columnKey='buildings'
            header={<SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.buildings} >
              BUILDINGS
            </SortHeaderCell>}
            cell={<StatsCell data={sortedDataList} field='buildings' />}
            width={100}
            flexGrow={1}
          />
          <Column
            columnKey='roads'
            header={<SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.roads} >
              KM OF ROAD
            </SortHeaderCell>
            }
            cell={<StatsCell data={sortedDataList} field='roads' />}
            width={120}
            flexGrow={1}
          />
          <Column
            columnKey='created_at'
            header={<SortHeaderCell
              onSortChange={this._onSortChange}
              sortDir={colSortDirs.created_at} >
              LAST UPDATE
            </SortHeaderCell>
            }
            cell={<StatsCell data={sortedDataList} field='created_at' />}
            width={150}
            flexGrow={1}
          />
        </Table>
        </div>
          </div>
        </section>
      </div>
    );
  }
});

