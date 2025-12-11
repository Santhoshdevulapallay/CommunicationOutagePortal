import React from "react";
import Form from "../common/form";
import { getUsers } from "../../services/userService";
import { getEquipment, saveEquipment } from "../../services/equipmentService";
import Joi from "joi-browser";
import { toast } from "react-toastify";

class EquipmentForm extends Form {
  state = {
    data: {
      description: "",

      location: "",
      ownership: [],
    },
    ownerList: [],
    errors: {},
  };

  schema = {
    _id: Joi.string(),
    description: Joi.string().required().label("Description"),
    location: Joi.string().required().label("Source"),
    ownership: Joi.array()
      .min(1)
      .required()
      .label("Ownership")
      .error(() => {
        return {
          message: "Please select atleast one Owner",
        };
      }),
  };

  async populateUsers() {
    const ownerList = await getUsers();
    this.setState({ ownerList });
  }

  async populateEquipment() {
    try {
      const equipmentId = this.props.match.params.id;
      if (equipmentId === "new") return;
      const { data: equipment } = await getEquipment(equipmentId);

      this.setState({ data: this.mapTOViewModel(equipment) });
    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
        this.props.history.replace("/not-found");
      }
    }
  }

  async componentDidMount() {
    await this.populateUsers();
    await this.populateEquipment();
  }

  mapTOViewModel(equipment) {
    var ownerList = [];
    for (var i = 0; i < equipment["ownership"].length; i++) {
      ownerList.push({
        value: equipment["ownership"][i],
        label: equipment["ownership"][i],
      });
    }
    return {
      _id: equipment._id,
      description: equipment.description,
      location: equipment.location,
      ownership: ownerList,
    };
  }

  doSubmit = async () => {
    try {
      await saveEquipment(this.state.data);
      this.props.history.push("/equipments");
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        toast.error("Bad Request to Server.");
      }
    }
  };

  render() {
    return (
      <div className="container">
        <br></br>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li
              className="breadcrumb-item active text-primary"
              aria-current="page"
            >
              {this.props.match.params.id === "new"
                ? "Create New Equipment"
                : "Edit Equipment"}
            </li>
          </ol>
        </nav>

        <form onSubmit={this.handleSubmit}>
          {this.renderInput("description", "Description")}
          {/* {this.renderSelect("genreId", "Genre", this.state.genres)} */}
          {this.renderInput("location", "Location")}
          {this.renderMultipleSelect(
            "ownership",
            "Ownership",
            this.state.ownerList
          )}
          {this.renderButton("Save")}
        </form>
      </div>
    );
  }
}

export default EquipmentForm;
