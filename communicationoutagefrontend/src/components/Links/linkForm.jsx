import React from "react";
import Form from "../common/form";
import { getUsers } from "../../services/userService";
import { getLink, saveLink } from "../../services/linkService";
import Joi from "joi-browser";
import { toast } from "react-toastify";

class LinkForm extends Form {
  state = {
    data: {
      description: "",
      source: "",
      destination: "",
      channelRouting: "",
      ownership: [],
      linkTypem:[],
      channelTypem:[],
      // linkType: "",
      pathType: ""
    },
    ownerList: [],
    linkTypemList: [{ value: "Data", label: "Data" }, { value: "Voice", label: "Voice" }, { value: "TeleProtection", label: "TeleProtection" }, { value: "VC", label: "VC" }],
    channelTypeList: [{value:"RTU", label:"RTU"},{value:"ICCP", label:"ICCP"},{value:"DCPC", label:"DCPC"},
    {value:"PMU", label:"PMU"},{value:"PDC", label:"PDC"},{value:"Voice", label:"Voice"},{value:"SPS", label:"SPS"}
    ,{value:"TeleProtection", label:"TeleProtection"}, {value:"VC", label:"VC"}],
    patheTypeList: [{value:"Main", label:"Main"}, {value:"StandBy", label:"StandBy"}],
    linkTypeList: [{value:"RTU", label:"RTU"},{value:"ICCP", label:"ICCP"},{value:"DCPC", label:"DCPC"},
    {value:"PMU", label:"PMU"},{value:"PDC", label:"PDC"},{value:"Voice", label:"Voice"},{value:"SPS", label:"SPS"}
    ,{value:"TeleProtection", label:"TeleProtection"}, {value:"VC", label:"VC"}],
    patheTypeList: [{value:"Main", label:"Main"}, {value:"StandBy", label:"StandBy"}],
    errors: {},
  };

  schema = {
    _id: Joi.string(),
    description: Joi.string().required().label("Description"),
    source: Joi.string().required().label("Source"),
    destination: Joi.string().required().label("Destination"),
    channelRouting: Joi.string().required().label("Chanel Routing"),
    // linkType: Joi.object({ label: Joi.string(), value: Joi.string() }).required().label("Link Type"),
    pathType: Joi.object({ label: Joi.string(), value: Joi.string() }).required().label("Path Type"),
    ownership: Joi.array()
      .min(1)
      .required()
      .label("Ownership")
      .error(() => {
        return {
          message: "Please select atleast one Owner",
        };
      }),
    linkTypem: Joi.array()
      .min(1)
      .required()
      .label("Link Type")
      .error(() => {
        return {
          message: "Please select atleast one Link Type",
        };
    }),
    channelTypem: Joi.array()
      .min(1)
      .required()
      .label("Channel Type")
      .error(() => {
        return {
          message: "Please select atleast one Channel Type",
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
    var linkTypemList = [];
    var channelTypemList = [];
    for (var i = 0; i < link["ownership"].length; i++) {
      ownerList.push({
        value: link["ownership"][i],
        label: link["ownership"][i],
      });
    }
    for (var i = 0; i < link["linkTypem"].length; i++) {
      linkTypemList.push({
        value: link["linkTypem"][i],
        label: link["linkTypem"][i],
      });
    }
    for (var i = 0; i < link["channelTypem"].length; i++) {
      channelTypemList.push({
        value: link["channelTypem"][i],
        label: link["channelTypem"][i],
      });
    }
    // var linkType = {value: link["linkType"], label: link["linkType"]};
    var pathType = {value: link["pathType"], label: link["pathType"]};
    return {
      _id: link._id,
      description: link.description,
      source: link.source,
      destination: link.destination,
      channelRouting: link.channelRouting,
      ownership: ownerList,
      linkTypem: linkTypemList,
      channelTypem: channelTypemList,
      // linkType: linkType,
      pathType: pathType
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
          {this.renderMultipleSelect(
            "linkTypem",
            "Link Type",
            this.state.linkTypemList
          )}
          {this.renderMultipleSelect(
            "channelTypem",
            "Channel Type",
            this.state.channelTypeList
          )}
          {/* {this.renderSelect("linkType", "Link Type", this.state.linkTypeList)} */}
          {this.renderSelect("pathType", "Path Type", this.state.patheTypeList)}
          <br></br>
          {this.renderButton("Save")}
        </form>
      </div>
    );
  }
}

export default LinkForm;
