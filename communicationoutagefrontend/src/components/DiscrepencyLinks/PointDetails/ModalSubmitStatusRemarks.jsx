import React from "react";
import Modal from "react-bootstrap/Modal";
import DisplayPointTable from "./DisplayPointTable";
import useTableDataContext from "../../../context/tableData";
import { SubmitStatusRemarksContextProvider } from "../../../context/submitStatusRemarks";
import SubmitStatusRemarksForm from "./SubmitStatusRemarksForm";

function ModalSubmitStatusRemarks(props){

    const { showModal, closeModal } = props;
    const { selectPointDetails } = useTableDataContext();

    return (
        <>
        <SubmitStatusRemarksContextProvider value={{selectPointDetails, closeModal}}>
            <Modal
            show={showModal}
            onHide={() => closeModal()}
            dialogClassName="modal-90w"
            aria-labelledby="example-custom-modal-styling-title"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="examCustom Mople-custom-modal-styling-title">
                        Selected Analog Points
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <SubmitStatusRemarksForm />
                    <DisplayPointTable />
                </Modal.Body>
            </Modal>
        </SubmitStatusRemarksContextProvider>
        </>
    )
}

export default ModalSubmitStatusRemarks;