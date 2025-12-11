import React from "react";
import Form from "../common/form";
import { getUsers } from "../../services/userService";
import { getLink, saveLink } from "../../services/linkService";
import Joi from "joi-browser";
import { toast } from "react-toastify";

class LinkForm extends Form {
  state = {
    data: {
      password: "",
    },
 
  };

  schema = {

    description: Joi.string().required().label("Description"),
    source: Joi.string().required().label("Source"),
    destination: Joi.string().required().label("Destination"),
    channelRouting: Joi.string().required().label("Chanel Routing"),
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

  async populateLink() {
    try {
      const linkId = this.props.match.params.id;
      if (linkId === "new") return;
      const { data: link } = await getLink(linkId);

      this.setState({ data: this.mapTOViewModel(link) });
    } catch (ex) {
      if (ex.response && ex.response.status === 404) {
        this.props.history.replace("/not-found");
      }
    }
  }

  async componentDidMount() {
    await this.populateUsers();
    await this.populateLink();
  }

  mapTOViewModel(link) {
    var ownerList = [];
    for (var i = 0; i < link["ownership"].length; i++) {
      ownerList.push({
        value: link["ownership"][i],
        label: link["ownership"][i],
      });
    }
    return {
      _id: link._id,
      description: link.description,
      source: link.source,
      destination: link.destination,
      channelRouting: link.channelRouting,
      ownership: ownerList,
    };
  }

  doSubmit = async () => {
    try {
      await saveLink(this.state.data);
      this.props.history.push("/links");
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        toast.error(ex.response.data);
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
                ? "Create New Link"
                : "Edit Link"}
            </li>
          </ol>
        </nav>

        <form onSubmit={this.handleSubmit}>
          {this.renderInput("description", "Description")}
          {/* {this.renderSelect("genreId", "Genre", this.state.genres)} */}
          {this.renderInput("source", "Source")}
          {this.renderInput("destination", "Destination")}
          {this.renderInput("channelRouting", "channelRouting")}
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

export default LinkForm;
