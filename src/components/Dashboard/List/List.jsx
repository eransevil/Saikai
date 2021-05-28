import React, { useContext, useState } from 'react';
import ViewPositionModal from '../../Modals/ViewPosition/ViewPositionModal';
import AddPositionModal from '../../Modals/AddPosition/AddPositionModal';
import Spinner from '../../Spinner/Spinner';
import Sort from '../Sort/Sort.jsx';

import useKanban from '../../../hooks/useKanban';
import ListHeader from './ListHeader';
import ListBody from './ListBody';
import { DragDropContext } from 'react-beautiful-dnd';
import { app } from '../../../config/firebase';
import * as S from './style.js';
import Messages from '../../Messages/Messages';
// Context Imports

import { SelectedPositionContext } from '../../../contexts/SelectedPositionContext';
import { PositionsContext } from '../../../contexts/PositionsContext';

import { MessagesContext } from '../../../contexts/MessagesContext';
import { useAuth } from '../../../contexts/AuthContext';

const List = (props = {}) => {
    const searchTerm = props.searchTerm || '';

    const { positions } = useContext(PositionsContext);
    const { setSelectedPosition } = useContext(SelectedPositionContext);
    const { information } = useContext(MessagesContext);
    const { currentUser } = useAuth();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedTitle, setSelectedTitle] = useState('');

    const addSelectedPosition = (position) => {
        setSelectedPosition({ data: position.doc, selected: true });
    };
    const { initialData, setInitialData } = useKanban(currentUser.uid);

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        const startColumn = initialData.columns.find((col) => col.id === source.droppableId);
        const startColumnIndex = initialData.columns.findIndex((col) => col.id === source.droppableId);
        const endColumn = initialData.columns.find((col) => col.id === destination.droppableId);
        const endColumnIndex = initialData.columns.findIndex((col) => col.id === destination.droppableId);

        if (startColumn === endColumn) {
            const newPositionIds = Array.from(endColumn.positionIds);

            newPositionIds.splice(source.index, 1);
            newPositionIds.splice(destination.index, 0, draggableId);

            const newColumn = {
                ...endColumn,
                positionIds: newPositionIds,
            };

            const newState = {
                ...initialData,
                columns: [...initialData.columns],
            };

            newState.columns[endColumnIndex] = newColumn;

            app.firestore()
                .collection('users')
                .doc(`${currentUser.uid}`)
                .collection('columns')
                .doc(`${startColumn.id}`)
                .update({ positionIds: newPositionIds });

            setInitialData(newState);

            return;
        }

        const startPositionIDs = Array.from(startColumn.positionIds);
        startPositionIDs.splice(source.index, 1);
        const newStart = {
            ...startColumn,
            taskIds: startPositionIDs,
        };

        const finishPositionIDs = Array.from(endColumn.positionIds);
        finishPositionIDs.splice(destination.index, 0, draggableId);
        const newFinish = {
            ...endColumn,
            taskIds: finishPositionIDs,
        };

        const newState = {
            ...initialData,
            columns: [...initialData.columns],
        };

        newState.columns[startColumnIndex] = newStart;
        newState.columns[endColumnIndex] = newFinish;

        app.firestore()
            .collection('users')
            .doc(`${currentUser.uid}`)
            .collection('columns')
            .doc(`${startColumn.id}`)
            .update({ positionIds: startPositionIDs });

        app.firestore()
            .collection('users')
            .doc(`${currentUser.uid}`)
            .collection('columns')
            .doc(`${endColumn.id}`)
            .update({ positionIds: finishPositionIDs });

        app.firestore().collection('positions').doc(`${draggableId}`).update({ status: endColumn.title });
        setInitialData(newState);
    };

    return (
        <S.ListWrapper>
            {positions.loading ? (
                <Spinner />
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    {initialData &&
                        initialData.columns.map((column, index) => {
                            return (
                                <S.List key={column.id}>
                                    <ListHeader
                                        setIsCreateOpen={setIsCreateOpen}
                                        setSelectedTitle={setSelectedTitle}
                                        column={column}
                                    />

                                    <Messages column={column} />

                                    <ListBody
                                        searchTerm={searchTerm}
                                        uid={currentUser.uid}
                                        setIsViewOpen={setIsViewOpen}
                                        addSelectedPosition={addSelectedPosition}
                                        positions={initialData.positions}
                                        column={column}
                                        initialData={initialData}
                                    />
                                </S.List>
                            );
                        })}
                </DragDropContext>
            )}
            <AddPositionModal
                selectedTitle={selectedTitle}
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
            <ViewPositionModal
                columns={initialData && initialData.columns}
                open={isViewOpen}
                onClose={() => setIsViewOpen(false)}
            />
        </S.ListWrapper>
    );
};

export default List;
